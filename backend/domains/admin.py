"""Domains app admin configuration."""

from django.contrib import admin

from .models import Domain, DomainGroup

admin.site.register(DomainGroup)
admin.site.register(Domain)
