"""
Wave generation logic.
Architecture doc section 6.2, 6.3.
"""
import random
from backend.models.enums import AttackType
from backend.models.game_state import Wave

# All available attack types in progression order
ATTACK_TYPES = [
    AttackType.DDOS_BOT,
    AttackType.CREDENTIAL_STUFFER,
    AttackType.SQL_INJECTION_PROBE,
    AttackType.PEAK_LOAD_ATTACK,
    AttackType.ZERO_DAY_EXPLOIT,
]


def generate_wave(wave_number: int, factory_traffic: float) -> Wave:
    """
    Generate a Wave for the given wave number.

    Scaling:
      - base attacker count grows linearly with wave_number
      - traffic multiplier scales count with factory output
      - HP scales 15% per wave
      - Boss (Zero-Day) appears every 5th wave
    """
    # Base attacker count (arch doc 6.2)
    base_count = 5 + wave_number * 3
    traffic_multiplier = 1.0 + (factory_traffic / 100.0)
    total_attackers = max(1, int(base_count * traffic_multiplier))

    # Attack types unlock progressively (arch doc 6.2)
    available_types = ATTACK_TYPES[: min(wave_number, len(ATTACK_TYPES))]

    # Boss wave every 5th
    has_boss = wave_number % 5 == 0

    # Pick random subset of available types for this wave's composition
    if has_boss:
        selected_types = list(available_types)
    else:
        # Pick 1-3 types randomly
        n = min(len(available_types), random.randint(1, 3))
        selected_types = random.sample(available_types, n)

    return Wave(
        wave_number=wave_number,
        attack_types=selected_types,
        total_attackers=total_attackers,
        has_boss=has_boss,
    )


def hp_scale_for_wave(wave_number: int) -> float:
    """HP scale factor: 15% increase per wave, 1.5x extra for boss waves."""
    base = 1.0 + (wave_number - 1) * 0.15
    return base


def spawn_type_for_index(wave: Wave, spawn_index: int) -> AttackType:
    """
    Determine which attack type to spawn for the n-th attacker in this wave.
    Boss always spawned last on boss waves.
    Other types distributed round-robin.
    """
    if wave.has_boss and spawn_index == wave.total_attackers - 1:
        return AttackType.ZERO_DAY_EXPLOIT

    non_boss = [t for t in wave.attack_types if t != AttackType.ZERO_DAY_EXPLOIT]
    if not non_boss:
        return AttackType.DDOS_BOT
    return non_boss[spawn_index % len(non_boss)]
