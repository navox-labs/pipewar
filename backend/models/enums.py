"""Application-level enums matching architecture doc section 3.5."""
from enum import Enum


class BuildingType(str, Enum):
    MINER = "miner"
    SMELTER = "smelter"
    ASSEMBLER = "assembler"
    BELT = "belt"
    RATE_LIMITER = "rate_limiter"
    WAF = "waf"
    AUTH_MIDDLEWARE = "auth_middleware"
    CIRCUIT_BREAKER = "circuit_breaker"


class ItemType(str, Enum):
    IRON_ORE = "iron_ore"
    COPPER_ORE = "copper_ore"
    IRON_PLATE = "iron_plate"
    COPPER_PLATE = "copper_plate"
    COPPER_WIRE = "copper_wire"
    GREEN_CIRCUIT = "green_circuit"
    ADVANCED_CIRCUIT = "advanced_circuit"


class Direction(str, Enum):
    NORTH = "north"
    EAST = "east"
    SOUTH = "south"
    WEST = "west"


class AttackType(str, Enum):
    DDOS_BOT = "ddos_bot"
    CREDENTIAL_STUFFER = "credential_stuffer"
    SQL_INJECTION_PROBE = "sql_injection_probe"
    PEAK_LOAD_ATTACK = "peak_load_attack"
    ZERO_DAY_EXPLOIT = "zero_day_exploit"


class GameStatus(str, Enum):
    ACTIVE = "active"
    WON = "won"
    LOST = "lost"
    ABANDONED = "abandoned"


class DefenseType(str, Enum):
    RATE_LIMITER = "rate_limiter"
    WAF = "waf"
    AUTH_MIDDLEWARE = "auth_middleware"
    CIRCUIT_BREAKER = "circuit_breaker"


PRODUCTION_TYPES = {BuildingType.MINER, BuildingType.SMELTER, BuildingType.ASSEMBLER}
DEFENSE_TYPES = {
    BuildingType.RATE_LIMITER,
    BuildingType.WAF,
    BuildingType.AUTH_MIDDLEWARE,
    BuildingType.CIRCUIT_BREAKER,
}
