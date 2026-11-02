import React from 'react';
import AppErrorFallback from './AppErrorFallback.jsx';
import TranslationEvents from '../../../i18n/TranslationEvents.js';

/**
 * Reload the current page.
 *
 * @returns {void}
 */
function reloadPage() {
  globalThis.location.reload();
}

/**
 * App-wide React error boundary: catches any render error thrown below it, logs it, and
 * renders `AppErrorFallback` instead of leaving the page blank.
 *
 * @description Sits outside `App`, so it subscribes to `TranslationEvents` itself: the
 *   `error_boundary` chunk loads lazily on its first `Translator.t()` miss, and the fallback must
 *   re-render once it resolves (`App`'s own remount on that event doesn't reach this component).
 */
export default class AppErrorBoundary extends React.Component {
  /**
   * Create the boundary.
   *
   * @param {object} props - Component props.
   * @param {React.ReactNode} props.children - The guarded tree.
   * @param {Function} [props.reload] - Page reload function, injectable for specs.
   */
  constructor(props) {
    super(props);
    this.state = { hasError: false };
    this.handleTranslationLoad = () => this.forceUpdate();
  }

  /**
   * Switch to the fallback state after a descendant throws.
   *
   * @returns {{hasError: boolean}} The new state.
   */
  static getDerivedStateFromError() {
    return { hasError: true };
  }

  /**
   * Subscribe to translation chunk loads.
   *
   * @returns {void}
   */
  componentDidMount() {
    TranslationEvents.subscribe(this.handleTranslationLoad);
  }

  /**
   * Unsubscribe from translation chunk loads.
   *
   * @returns {void}
   */
  componentWillUnmount() {
    TranslationEvents.unsubscribe(this.handleTranslationLoad);
  }

  /**
   * Log the caught error and its component stack.
   *
   * @param {Error} error - The error thrown while rendering.
   * @param {{componentStack: string}} info - React error info.
   * @returns {void}
   */
  componentDidCatch(error, info) {
    console.error('AppErrorBoundary caught a render error', error, info?.componentStack);
  }

  /**
   * Render the children, or the fallback once an error was caught.
   *
   * @returns {React.ReactNode} The guarded tree or the fallback.
   */
  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return <AppErrorFallback onReload={this.props.reload ?? reloadPage} />;
  }
}
