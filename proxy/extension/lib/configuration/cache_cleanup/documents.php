<?php
/**
 * Cache-cleanup groups for the documents resource family, consumed by
 * cache_cleanup_map.php to build $cacheCleanupMap.
 *
 * @return array List of documents-family cache-cleanup groups.
 */

return [
    // documents entity family — routes mutating a GameDocument or its files/photos.
    [
        'targets' => [
            '/games/:game_slug/documents.json',
            '/games/:game_slug/documents/all.json',
            '/games/:game_slug/documents/:document_id.json',
            '/games/:game_slug/documents/:document_id/full.json',
            '/games/:game_slug/documents/:document_id/photos.json',
            '/games/:game_slug/documents/:document_id/photos/all.json',
            '/games/:game_slug/documents/:document_id/files.json',
            '/games/:game_slug/documents/:document_id/files/all.json',
        ],
        'routes' => [
            '/games/:game_slug/documents/:document_id.json',
            '/games/:game_slug/documents/:document_id/photo_upload.json',
            '/games/:game_slug/documents/:document_id/file_upload.json',
            '/games/:game_slug/documents/:document_id/photos/:photo_id/set.json',
            '/games/:game_slug/documents/:document_id/files/:file_id/photo_upload.json',
        ],
    ],
];
