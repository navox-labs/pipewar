"""Unit tests for wave generation."""
import pytest
from backend.combat.wave_generator import generate_wave, hp_scale_for_wave, spawn_type_for_index
from backend.models.enums import AttackType


def test_wave_1_uses_only_ddos_bot():
    wave = generate_wave(1, 0.0)
    # Wave 1: only DDoS bots available
    assert AttackType.DDOS_BOT in wave.attack_types


def test_wave_count_scales_with_wave_number():
    w1 = generate_wave(1, 0.0)
    w5 = generate_wave(5, 0.0)
    assert w5.total_attackers > w1.total_attackers


def test_traffic_multiplier_increases_count():
    w_low = generate_wave(3, 0.0)
    w_high = generate_wave(3, 100.0)
    assert w_high.total_attackers > w_low.total_attackers


def test_boss_wave_every_5th():
    assert generate_wave(5, 0.0).has_boss is True
    assert generate_wave(10, 0.0).has_boss is True
    assert generate_wave(3, 0.0).has_boss is False
    assert generate_wave(7, 0.0).has_boss is False


def test_hp_scale_increases_per_wave():
    assert hp_scale_for_wave(1) == 1.0
    assert hp_scale_for_wave(2) > hp_scale_for_wave(1)
    assert hp_scale_for_wave(10) > hp_scale_for_wave(5)


def test_boss_wave_has_zero_day_exploit():
    wave = generate_wave(5, 0.0)
    assert wave.has_boss
    # Boss should appear as last attacker
    last_type = spawn_type_for_index(wave, wave.total_attackers - 1)
    assert last_type == AttackType.ZERO_DAY_EXPLOIT


def test_wave_always_has_at_least_one_attacker():
    for wn in range(1, 11):
        wave = generate_wave(wn, 0.0)
        assert wave.total_attackers >= 1


def test_available_types_unlock_progressively():
    w1 = generate_wave(1, 0.0)
    w3 = generate_wave(3, 0.0)
    # Wave 1 cannot have zero day
    assert AttackType.ZERO_DAY_EXPLOIT not in w1.attack_types
    # Wave 3 can have more types than wave 1


def test_hp_scale_formula():
    # Architecture doc: 1.0 + (wave_number - 1) * 0.15
    assert abs(hp_scale_for_wave(1) - 1.0) < 1e-9
    assert abs(hp_scale_for_wave(2) - 1.15) < 1e-9
    assert abs(hp_scale_for_wave(3) - 1.30) < 1e-9
