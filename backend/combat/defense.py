"""
Defense system helpers.
Architecture doc section 7.
"""
from backend.models.enums import BuildingType, PRODUCTION_TYPES, DEFENSE_TYPES
from backend.models.game_state import Cell

# Circuit breaker activates when health < 30%
CIRCUIT_BREAKER_THRESHOLD = 0.3
# Duration (ticks) of circuit breaker block-all mode
CIRCUIT_BREAKER_DURATION = 100  # 5 seconds at 20 ticks/sec


def find_exposed_machines(
    cells: dict[tuple[int, int], Cell],
    defense_coverage: dict[tuple[int, int], set[BuildingType]],
) -> set[tuple[int, int]]:
    """
    Return positions of production machines that are NOT in any defense coverage zone.
    These are highlighted in the HUD during a wave (arch doc 7.3).
    """
    exposed = set()
    for pos, cell in cells.items():
        if cell.building and cell.building.type in PRODUCTION_TYPES:
            if pos not in defense_coverage:
                exposed.add(pos)
    return exposed


def check_circuit_breaker_activation(
    cells: dict[tuple[int, int], Cell],
) -> bool:
    """
    Returns True if any circuit breaker with health < 30% is present.
    When True, all attackers should be blocked for CIRCUIT_BREAKER_DURATION ticks.
    """
    for cell in cells.values():
        b = cell.building
        if b and b.type == BuildingType.CIRCUIT_BREAKER:
            if b.health > 0 and b.health < b.health * CIRCUIT_BREAKER_THRESHOLD:
                return True
    return False


def slow_ddos_bots(
    attackers: list,
    defense_coverage: dict[tuple[int, int], set[BuildingType]],
):
    """
    Rate Limiters slow DDoS bots by 50% when in coverage zone (arch doc 7.1).
    Modifies attacker speed in-place.
    """
    from backend.models.enums import AttackType
    from backend.combat.attacker import ATTACKER_STATS

    for attacker in attackers:
        if attacker.attack_type != AttackType.DDOS_BOT:
            continue
        cell_pos = (int(attacker.x), int(attacker.y))
        coverage = defense_coverage.get(cell_pos, set())
        base_speed = ATTACKER_STATS[AttackType.DDOS_BOT]["speed"]
        if BuildingType.RATE_LIMITER in coverage:
            attacker.speed = base_speed * 0.5
        else:
            attacker.speed = base_speed
