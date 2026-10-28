import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import VisitsSummaryCardHelper from '../../../../../../../../../assets/js/components/resources/staff_dashboard/pages/elements/helpers/VisitsSummaryCardHelper.jsx';
import Translator from '../../../../../../../../../assets/js/i18n/Translator.js';

describe('VisitsSummaryCardHelper', function() {
  const buildHandlers = () => ({
    onPeriodChange: jasmine.createSpy('onPeriodChange'),
    onClear: jasmine.createSpy('onClear'),
    onRefresh: jasmine.createSpy('onRefresh'),
  });

  const buildState = (overrides = {}) => ({
    summary: 42, status: 'idle', loading: false, error: false, period: 'day', ...overrides,
  });

  const renderHtml = (state) => renderToStaticMarkup(VisitsSummaryCardHelper.render(state, buildHandlers()));
  const escape = (text) => renderToStaticMarkup(React.createElement('span', null, text)).slice(6, -7);

  describe('.render', function() {
    it('renders the title and the loading text while loading', function() {
      const html = renderHtml(buildState({ summary: null, loading: true }));

      expect(html).toContain(escape(Translator.t('staff_dashboard.visits_summary_title')));
      expect(html).toContain(escape(Translator.t('staff_dashboard.loading')));
    });

    it('renders the load error on error', function() {
      const html = renderHtml(buildState({ summary: null, error: true }));

      expect(html).toContain(escape(Translator.t('staff_dashboard.visits_summary_load_error')));
    });

    it('renders the count once loaded', function() {
      expect(renderHtml(buildState())).toContain('<span>42</span>');
    });

    it('renders a zero count as 0', function() {
      expect(renderHtml(buildState({ summary: 0 }))).toContain('<span>0</span>');
    });

    it('renders the period select with the three options and the current period', function() {
      const html = renderHtml(buildState({ period: 'week' }));

      expect(html).toContain('form-select form-select-sm');
      expect(html).toContain(escape(Translator.t('staff_dashboard.visits_period_label')));
      expect(html).toContain('<option value="day">');
      expect(html).toContain('<option value="week" selected="">');
      expect(html).toContain('<option value="month">');
      expect(html).toContain(escape(Translator.t('staff_dashboard.visits_period_month')));
    });

    it('links to the statistics page', function() {
      const html = renderHtml(buildState());

      expect(html).toContain('href="#/staff/statistics"');
      expect(html).toContain(escape(Translator.t('staff_dashboard.visits_statistics_link')));
    });

    it('renders the success feedback with both counts substituted', function() {
      const html = renderHtml(buildState({ status: { state: 'success', deletedVisits: 7, deletedSessions: 3 } }));
      const expected = Translator.t('staff_dashboard.visits_clear_success')
        .replace('{{visits}}', 7)
        .replace('{{sessions}}', 3);

      expect(html).toContain('text-success');
      expect(html).toContain(escape(expected));
    });

    it('renders the clear error feedback', function() {
      const html = renderHtml(buildState({ status: 'error' }));

      expect(html).toContain(escape(Translator.t('staff_dashboard.visits_clear_error')));
    });

    it('renders no feedback when idle', function() {
      const html = renderHtml(buildState());

      expect(html).not.toContain('text-success');
      expect(html).not.toContain('text-danger');
    });

    it('enables the select and actions when idle', function() {
      expect(renderHtml(buildState())).not.toContain('disabled');
    });

    it('disables the select and both actions while loading', function() {
      const html = renderHtml(buildState({ loading: true }));

      expect(html.match(/disabled=""/g).length).toBe(3);
    });

    it('disables the select and both actions while clearing', function() {
      const html = renderHtml(buildState({ status: 'loading' }));

      expect(html.match(/disabled=""/g).length).toBe(3);
    });

    it('wires the clear and refresh handlers with distinct icons', function() {
      const handlers = buildHandlers();
      const rendered = VisitsSummaryCardHelper.render(buildState(), handlers);
      const [clearAction, refreshAction] = rendered.props.actions.props.children[0].props.actions;

      expect(clearAction.onClick).toBe(handlers.onClear);
      expect(clearAction.icon).toBe('bi-trash-fill');
      expect(clearAction.tooltip).toBe(Translator.t('staff_dashboard.visits_clear_tooltip'));
      expect(refreshAction.onClick).toBe(handlers.onRefresh);
      expect(refreshAction.icon).toBe('bi-arrow-clockwise');
      expect(refreshAction.tooltip).toBe(Translator.t('staff_dashboard.refresh_tooltip'));
    });
  });
});
