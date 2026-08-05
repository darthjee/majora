<?php

namespace Tent\RequestHandlers\Tests;

use PHPUnit\Framework\TestCase;
use Tent\RequestHandlers\DuDirectorySizeStrategy;
use Tent\RequestHandlers\ShellCommandFailedException;
use Tent\RequestHandlers\ShellExecutorInterface;

/**
 * Unit tests for DuDirectorySizeStrategy.
 *
 * Injects a fake ShellExecutorInterface (mirroring how BackendClientTest
 * fakes HttpClientInterface), so no real `du` subprocess is ever spawned:
 * every test controls exactly what "ran" and asserts how the strategy reacts.
 */
class DuDirectorySizeStrategyTest extends TestCase
{
    /**
     * A successful `du -sb` run has its "<bytes>\t<path>" output line parsed
     * into an integer byte count.
     */
    public function testParsesByteCountFromSuccessfulOutput(): void
    {
        $shell = $this->createMock(ShellExecutorInterface::class);
        $shell->expects($this->once())
            ->method('exec')
            ->with($this->stringContains('du -sb'))
            ->willReturn(['output' => ["12345\t/some/path"], 'exitCode' => 0]);

        $strategy = new DuDirectorySizeStrategy($shell);

        $this->assertSame(12345, $strategy->sizeOf('/some/path'));
    }

    /**
     * The measured path is shell-escaped into the `du -sb` command.
     */
    public function testShellEscapesThePath(): void
    {
        $shell = $this->createMock(ShellExecutorInterface::class);
        $shell->expects($this->once())
            ->method('exec')
            ->with('du -sb ' . escapeshellarg('/some path/with spaces'))
            ->willReturn(['output' => ["100\t/some path/with spaces"], 'exitCode' => 0]);

        $strategy = new DuDirectorySizeStrategy($shell);

        $this->assertSame(100, $strategy->sizeOf('/some path/with spaces'));
    }

    /**
     * A non-zero exit code (e.g. the `du` binary is missing, or the path
     * doesn't exist) raises ShellCommandFailedException rather than
     * silently falling back to another strategy.
     */
    public function testNonZeroExitCodeThrows(): void
    {
        $shell = $this->createMock(ShellExecutorInterface::class);
        $shell->method('exec')->willReturn(['output' => [], 'exitCode' => 127]);

        $strategy = new DuDirectorySizeStrategy($shell);

        $this->expectException(ShellCommandFailedException::class);

        $strategy->sizeOf('/some/path');
    }

    /**
     * An exit code of 0 with no output line to parse also raises
     * ShellCommandFailedException, rather than being (mis)treated as a size
     * of 0.
     */
    public function testEmptyOutputWithZeroExitCodeThrows(): void
    {
        $shell = $this->createMock(ShellExecutorInterface::class);
        $shell->method('exec')->willReturn(['output' => [], 'exitCode' => 0]);

        $strategy = new DuDirectorySizeStrategy($shell);

        $this->expectException(ShellCommandFailedException::class);

        $strategy->sizeOf('/some/path');
    }

    /**
     * The exception raised on failure carries the command and exit code.
     */
    public function testFailureExceptionCarriesCommandAndExitCode(): void
    {
        $shell = $this->createMock(ShellExecutorInterface::class);
        $shell->method('exec')->willReturn(['output' => [], 'exitCode' => 1]);

        $strategy = new DuDirectorySizeStrategy($shell);

        try {
            $strategy->sizeOf('/some/path');
            $this->fail('Expected ShellCommandFailedException to be thrown.');
        } catch (ShellCommandFailedException $e) {
            $this->assertSame(1, $e->exitCode());
            $this->assertStringContainsString('du -sb', $e->command());
        }
    }

    /**
     * Omitting $shell still allows the strategy to be constructed (it
     * defaults internally to NativeShellExecutor).
     */
    public function testConstructorAcceptsNoExplicitShellExecutor(): void
    {
        $strategy = new DuDirectorySizeStrategy();

        $this->assertInstanceOf(DuDirectorySizeStrategy::class, $strategy);
    }
}
