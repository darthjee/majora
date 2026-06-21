"""Views package for the games app."""

from .auth import login, logout, register, status, test_email
from .characters import game_npc_detail, game_npcs, game_pc_detail, game_pcs
from .games import game_detail, games_list
from .password_reset import recover, reset_password

__all__ = [
    'games_list',
    'game_detail',
    'game_pcs',
    'game_npcs',
    'game_npc_detail',
    'game_pc_detail',
    'login',
    'logout',
    'register',
    'status',
    'test_email',
    'recover',
    'reset_password',
]
