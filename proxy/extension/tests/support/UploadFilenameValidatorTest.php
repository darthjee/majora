<?php

namespace Tent\RequestHandlers\Tests;

use PHPUnit\Framework\TestCase;
use Tent\RequestHandlers\UploadFilenameValidator;

/**
 * Unit tests for UploadFilenameValidator.
 */
class UploadFilenameValidatorTest extends TestCase
{
    private const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

    /**
     * @dataProvider allowedFilenamesProvider
     */
    public function testAllowsSingleAllowListedExtension(string $filename): void
    {
        $validator = new UploadFilenameValidator(self::IMAGE_EXTENSIONS);

        $this->assertTrue($validator->isAllowed($filename));
    }

    public static function allowedFilenamesProvider(): array
    {
        return [
            'jpg'               => ['photo.jpg'],
            'jpeg'              => ['photo.jpeg'],
            'png'               => ['photo.png'],
            'gif'               => ['photo.gif'],
            'webp'              => ['photo.webp'],
            'uppercase JPG'     => ['photo.JPG'],
            'mixed case JpEg'   => ['photo.JpEg'],
            'uppercase PNG'     => ['PHOTO.PNG'],
        ];
    }

    /**
     * @dataProvider doubleExtensionFilenamesProvider
     */
    public function testRejectsDoubleExtensionEvenWhenLastSegmentIsAllowed(string $filename): void
    {
        $validator = new UploadFilenameValidator(self::IMAGE_EXTENSIONS);

        $this->assertFalse($validator->isAllowed($filename));
    }

    public static function doubleExtensionFilenamesProvider(): array
    {
        return [
            'php then jpg' => ['image.php.jpg'],
            'jpg then png' => ['image.jpg.png'],
            'triple'       => ['image.tar.gz.jpg'],
        ];
    }

    /**
     * A single, but disallowed, extension is rejected.
     */
    public function testRejectsDisallowedSingleExtension(): void
    {
        $validator = new UploadFilenameValidator(self::IMAGE_EXTENSIONS);

        $this->assertFalse($validator->isAllowed('photo.txt'));
    }

    /**
     * A filename with no extension at all is rejected.
     */
    public function testRejectsFilenameWithNoExtension(): void
    {
        $validator = new UploadFilenameValidator(self::IMAGE_EXTENSIONS);

        $this->assertFalse($validator->isAllowed('photo'));
    }

    /**
     * The allow-list is caller-supplied: a different list (e.g. 'file'
     * uploads' pdf-only allow-list) accepts/rejects accordingly.
     */
    public function testUsesCallerSuppliedAllowList(): void
    {
        $validator = new UploadFilenameValidator(['pdf']);

        $this->assertTrue($validator->isAllowed('document.pdf'));
        $this->assertFalse($validator->isAllowed('photo.jpg'));
    }

    /**
     * The allow-list is matched case-insensitively regardless of the casing
     * it was supplied in.
     */
    public function testAllowListMatchingIsCaseInsensitiveRegardlessOfSuppliedCasing(): void
    {
        $validator = new UploadFilenameValidator(['PDF']);

        $this->assertTrue($validator->isAllowed('document.pdf'));
        $this->assertTrue($validator->isAllowed('document.PDF'));
    }
}
