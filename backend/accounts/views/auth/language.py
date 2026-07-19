"""View for persisting a user's favorite language preference."""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from accounts.models import UserProfile


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def language(request):
    """Persist the requesting user's favorite language preference."""
    value = request.data.get('language', '')
    profile, _ = UserProfile.objects.get_or_create(user=request.user)
    profile.favorite_language = value
    profile.save()
    return Response({'favorite_language': profile.favorite_language})
