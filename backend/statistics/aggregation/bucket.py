"""A single time bucket of a statistics series."""

from datetime import date
from typing import NamedTuple


class Bucket(NamedTuple):
    """A bucket of inclusive local dates, already clipped to the requested range."""

    start: date
    end: date
