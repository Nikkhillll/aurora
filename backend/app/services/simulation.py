"""What-if engine. Person 5's slider calls this via POST /simulate."""
import copy

from app.services import ml_bridge, state, alerts

_NARRATIVE = {
    "storm": ("At {sev}% storm severity, wind generation drops roughly {gen_drop}% "
              "while heating load rises. Battery endurance falls from {base}h to {proj}h."),
    "equipment_failure": ("A {sev}% severity equipment failure removes part of the "
                          "generation capacity. Endurance falls from {base}h to {proj}h."),
    "resupply_delay": ("A {sev}% severity resupply delay forces fuel rationing and "
                       "reduced generation. Endurance falls from {base}h to {proj}h."),
}


def _apply_scenario(snap: dict, scenario: str, severity: int) -> dict:
    s = severity / 100
    out = copy.deepcopy(snap)
    env, en = out["environment"], out["energy"]

    if scenario == "storm":
        env["wind_speed_ms"] = round(env["wind_speed_ms"] + 30 * s, 2)
        env["temperature_c"] = round(env["temperature_c"] - 12 * s, 2)
        env["pressure_hpa"] = round(env["pressure_hpa"] - 25 * s, 2)
        env["visibility_km"] = round(max(0.1, env["visibility_km"] * (1 - 0.9 * s)), 2)
        en["generation_kw"] = round(en["generation_kw"] * (1 - 0.7 * s), 2)
        en["consumption_kw"] = round(en["consumption_kw"] * (1 + 0.35 * s), 2)
    elif scenario == "equipment_failure":
        en["generation_kw"] = round(en["generation_kw"] * (1 - 0.8 * s), 2)
        out["infrastructure"]["equipment_health_pct"] = round(
            out["infrastructure"]["equipment_health_pct"] * (1 - 0.6 * s))
    elif scenario == "resupply_delay":
        out["logistics"]["fuel_level_pct"] = round(
            out["logistics"]["fuel_level_pct"] * (1 - 0.7 * s))
        out["logistics"]["supplies_level_pct"] = round(
            out["logistics"]["supplies_level_pct"] * (1 - 0.5 * s))
        en["generation_kw"] = round(en["generation_kw"] * (1 - 0.3 * s), 2)

    state.recompute(out)
    return out


def _timeline(snap: dict, hours: int = 24) -> list[dict]:
    en = snap["energy"]
    net = en["generation_kw"] - en["consumption_kw"]
    drain_per_hour = 0.0 if net >= 0 else abs(net) / 120 * 100  # % of bank per hour
    pct = en["battery_level_pct"]
    points = []
    for h in range(hours + 1):
        points.append({"hour": h, "battery_pct": round(max(0.0, pct), 1)})
        pct -= drain_per_hour
    return points


def run(station_id: str, scenario: str, severity: int) -> dict:
    base_snap = state.snapshot(station_id)
    proj_snap = _apply_scenario(base_snap, scenario, severity)

    base_hours = ml_bridge.battery_hours(base_snap)
    proj_hours = ml_bridge.battery_hours(proj_snap)
    alerts.evaluate(station_id, snap=proj_snap)

    narrative = _NARRATIVE[scenario].format(
        sev=severity,
        gen_drop=round(70 * severity / 100),
        base=base_hours,
        proj=proj_hours,
    )

    return {
        "station_id": station_id,
        "scenario": scenario,
        "severity": severity,
        "baseline": {
            "battery_hours_remaining": base_hours,
            "risk_level": ml_bridge.storm_risk(base_snap),
        },
        "projected": {
            "battery_hours_remaining": proj_hours,
            "risk_level": ml_bridge.storm_risk(proj_snap),
        },
        "timeline": _timeline(proj_snap),
        "narrative": narrative,
    }
