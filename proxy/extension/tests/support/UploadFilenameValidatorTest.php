<?php

namespace Tent\RequestHandlers\Tests;

use PHPUnit\Framework\TestCase;
use Tent\RequestHandlers\UploadFilenameValidator;

/**
 * Unit tests for UploadFilenameValidator.
 */
class UploadFilenameValidatorTest extends TestCase
{
    /**
     * @dataProvider allowedFilenamesProvider
     */
    public function testAllowsSingleAllowListedExtension(string $filename): void
    {
        $validator = new UploadFilenameValidator();

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
        $validator = new UploadFilenameValidator();

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
        $validator = new UploadFilenameValidator();

        $this->assertFalse($validator->isAllowed('photo.txt'));
    }

    /**
     * A filename with no extension at all is rejected.
     */
    public function testRejectsFilenameWithNoExtension(): void
    {
        $validator = new UploadFilenameValidator();

        $this->assertFalse($validator->isAllowed('photo'));
    }
}
