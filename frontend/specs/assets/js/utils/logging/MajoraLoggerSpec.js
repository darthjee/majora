const MODULE_PATH = '../../../../../assets/js/utils/logging/MajoraLogger.js';

/**
 * @description Imports a fresh copy of `MajoraLogger`, forcing Node to
 *   re-evaluate its top-level module code (and thus re-read the current
 *   `VITE_FRONTEND_LOG_LEVEL`) instead of returning an already-cached module.
 * @returns {Promise<Function>} The freshly-loaded `MajoraLogger` class.
 */
async function freshMajoraLogger() {
  const loaded = await import(`${MODULE_PATH}?spec=${Date.now()}-${Math.random()}`);
  return loaded.default;
}

describe('MajoraLogger', function() {
  const originalLevel = process.env.VITE_FRONTEND_LOG_LEVEL;

  afterEach(function() {
    if (originalLevel === undefined) {
      delete process.env.VITE_FRONTEND_LOG_LEVEL;
    } else {
      process.env.VITE_FRONTEND_LOG_LEVEL = originalLevel;
    }
  });

  describe('when VITE_FRONTEND_LOG_LEVEL is not defined', function() {
    beforeEach(function() {
      delete process.env.VITE_FRONTEND_LOG_LEVEL;
    });

    it('calls console.error for an error log', async function() {
      const errorSpy = spyOn(console, 'error');
      const MajoraLogger = await freshMajoraLogger();

      MajoraLogger.error({ some_data: 'some value' });

      expect(errorSpy).toHaveBeenCalledWith({ some_data: 'some value' });
    });

    it('does not call console.debug for a debug log', async function() {
      const debugSpy = spyOn(console, 'debug');
      const MajoraLogger = await freshMajoraLogger();

      MajoraLogger.debug({ some_data: 'some value' });

      expect(debugSpy).not.toHaveBeenCalled();
    });
  });

  describe('when VITE_FRONTEND_LOG_LEVEL is "debug"', function() {
    beforeEach(function() {
      process.env.VITE_FRONTEND_LOG_LEVEL = 'debug';
    });

    it('calls console.error for an error log', async function() {
      const errorSpy = spyOn(console, 'error');
      const MajoraLogger = await freshMajoraLogger();

      MajoraLogger.error({ some_data: 'some value' });

      expect(errorSpy).toHaveBeenCalledWith({ some_data: 'some value' });
    });

    it('calls console.debug for a debug log', async function() {
      const debugSpy = spyOn(console, 'debug');
      const MajoraLogger = await freshMajoraLogger();

      MajoraLogger.debug({ some_data: 'some value' });

      expect(debugSpy).toHaveBeenCalledWith({ some_data: 'some value' });
    });
  });

  describe('when VITE_FRONTEND_LOG_LEVEL is set to an unknown value', function() {
    it('falls back to the error-only threshold', async function() {
      process.env.VITE_FRONTEND_LOG_LEVEL = 'not-a-real-level';
      const debugSpy = spyOn(console, 'debug');
      const errorSpy = spyOn(console, 'error');
      const MajoraLogger = await freshMajoraLogger();

      MajoraLogger.debug({ some_data: 'some value' });
      MajoraLogger.error({ some_data: 'some value' });

      expect(debugSpy).not.toHaveBeenCalled();
      expect(errorSpy).toHaveBeenCalledWith({ some_data: 'some value' });
    });
  });

  describe('when VITE_FRONTEND_LOG_LEVEL is "info"', function() {
    it('logs warn and info but not debug', async function() {
      process.env.VITE_FRONTEND_LOG_LEVEL = 'info';
      const warnSpy = spyOn(console, 'warn');
      const infoSpy = spyOn(console, 'info');
      const debugSpy = spyOn(console, 'debug');
      const MajoraLogger = await freshMajoraLogger();

      MajoraLogger.warn({ level: 'warn' });
      MajoraLogger.info({ level: 'info' });
      MajoraLogger.debug({ level: 'debug' });

      expect(warnSpy).toHaveBeenCalledWith({ level: 'warn' });
      expect(infoSpy).toHaveBeenCalledWith({ level: 'info' });
      expect(debugSpy).not.toHaveBeenCalled();
    });
  });
});
