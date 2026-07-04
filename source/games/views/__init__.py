"""Views package for the games app."""

from .auth import language, login, logout, register, status, test_email
from .characters import (
    game_npc_access,
    game_npc_detail,
    game_npc_full,
    game_npc_photo_upload,
    game_npc_photos,
    game_npcs,
    game_npcs_all,
    game_pc_access,
    game_pc_detail,
    game_pc_full,
    game_pc_photo_upload,
    game_pc_photos,
    game_pcs,
)
from .game_masters import game_master_detail, game_masters_list
from .game_sessions import game_session_detail, game_sessions_list
from .games import game_access, game_detail, game_photos, game_treasures, games_list
from .health import health
from .password_reset import recover, reset_password
from .photo_upload import photo_upload
from .treasures import treasure_access, treasure_detail, treasure_photo_upload, treasures_list
from .upload_finalize import upload_finalize

__all__ = [
    'games_list',
    'game_detail',
    'game_access',
    'game_treasures',
    'game_photos',
    'game_pcs',
    'game_npcs',
    'game_npcs_all',
    'game_npc_access',
    'game_npc_detail',
    'game_npc_full',
    'game_pc_access',
    'game_pc_detail',
    'game_pc_full',
    'game_pc_photo_upload',
    'game_npc_photo_upload',
    'game_pc_photos',
    'game_npc_photos',
    'game_masters_list',
    'game_master_detail',
    'game_sessions_list',
    'game_session_detail',
    'language',
    'login',
    'logout',
    'register',
    'status',
    'test_email',
    'recover',
    'reset_password',
    'photo_upload',
    'treasure_access',
    'treasure_detail',
    'treasure_photo_upload',
    'treasures_list',
    'upload_finalize',
    'health',
]
