import audienceSeries
  from '../../../../../../../../assets/js/components/resources/staff_statistics/pages/helpers/audienceSeries.js';

describe('audienceSeries', function() {
  it('returns both series for all', function() {
    expect(audienceSeries('all')).toEqual(['anonymous', 'logged_in']);
  });

  it('returns only anonymous for the anonymous audience', function() {
    expect(audienceSeries('anonymous')).toEqual(['anonymous']);
  });

  it('returns only logged_in for the logged_in audience', function() {
    expect(audienceSeries('logged_in')).toEqual(['logged_in']);
  });

  it('returns both series without an audience', function() {
    expect(audienceSeries(undefined)).toEqual(['anonymous', 'logged_in']);
  });

  it('returns both series for an unknown audience', function() {
    expect(audienceSeries('robots')).toEqual(['anonymous', 'logged_in']);
  });
});
