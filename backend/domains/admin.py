"""Domains app admin configuration."""

from django.contrib import admin

from .models import Domain, DomainConfiguration, DomainGroup

admin.site.register(DomainGroup)
admin.site.register(Domain)
admin.site.register(DomainConfiguration)
