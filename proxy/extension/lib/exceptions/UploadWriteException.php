<?php

namespace Tent\RequestHandlers;

use RuntimeException;

/**
 * Raised when UploadStorageResolver fails to write an uploaded file to its
 * destination (reading the uploaded bytes, writing the temporary file, or
 * renaming it over the destination).
 *
 * When this is raised, any pre-existing file at the destination is left
 * untouched and the temporary file has already been removed.
 */
class UploadWriteException extends RuntimeException
{
}
