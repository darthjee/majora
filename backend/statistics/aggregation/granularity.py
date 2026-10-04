"""Bucket granularity values and the auto-resolution thresholds."""


class Granularity:
    """Granularity enum values and the rule resolving `auto` from the range length."""

    DAY = 'day'
    WEEK = 'week'
    MONTH = 'month'
    AUTO = 'auto'
    CHOICES = (AUTO, DAY, WEEK, MONTH)

    DAY_MAX_DAYS = 31
    WEEK_MAX_DAYS = 186

    @classmethod
    def resolve(cls, requested, from_date, to_date):
        """Return the effective granularity for `requested` over the inclusive date range."""
        if requested != cls.AUTO:
            return requested
        return cls._for_days((to_date - from_date).days + 1)

    @classmethod
    def _for_days(cls, days):
        """Return the auto granularity for an inclusive range of `days` days."""
        if days <= cls.DAY_MAX_DAYS:
            return cls.DAY
        if days <= cls.WEEK_MAX_DAYS:
            return cls.WEEK
        return cls.MONTH
