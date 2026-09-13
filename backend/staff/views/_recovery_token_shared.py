"""Shared helpers for the staff recovery-token action views (unexpire/force-expire/delete)."""

import logging

logger = logging.getLogger(__name__)


def log_recovery_token_action(action, record_id, user_id, staff_user_id):
    """Log a staff recovery-token mutation, never including the raw token value."""
    logger.info(
        'staff_recovery_token_action action=%s record_id=%s user_id=%s staff_id=%s',
        action, record_id, user_id, staff_user_id,
    )
