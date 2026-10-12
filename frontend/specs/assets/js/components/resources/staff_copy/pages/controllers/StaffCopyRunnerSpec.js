import StaffCopyRunner from '../../../../../../../../assets/js/components/resources/staff_copy/pages/controllers/StaffCopyRunner.js';

describe('StaffCopyRunner', function() {
  let actions;
  let onChange;
  const rows = [{ id: 1, name: 'Sword' }, { id: 2, name: 'Shield' }];

  beforeEach(function() {
    actions = jasmine.createSpyObj('actions', ['copy', 'link']);
    onChange = jasmine.createSpy('onChange');
  });

  it('copies every row and links every file in order', async function() {
    actions.copy.and.callFake((type, id) => Promise.resolve({
      ok: true, status: 201, data: { id: id + 10, links: [{ upload_id: id * 100, upload_type: 'image', token: 't' }] },
    }));
    actions.link.and.returnValue(Promise.resolve({ ok: true, status: 200 }));

    const result = await new StaffCopyRunner(actions, onChange).run('items', 'target', rows);

    expect(actions.copy.calls.allArgs()).toEqual([['items', 1, 'target'], ['items', 2, 'target']]);
    expect(actions.link.calls.count()).toBe(2);
    expect(result.running).toBe(false);
    expect(result.done).toBe(2);
    expect(result.total).toBe(2);
    expect(result.entities.map((entity) => entity.status)).toEqual(['copied', 'copied']);
    expect(result.entities[0].links[0].status).toBe('linked');
    expect(onChange.calls.first().args[0]).toEqual(jasmine.objectContaining({ running: true, done: 0 }));
  });

  it('publishes copying and linking states while running', async function() {
    actions.copy.and.returnValue(Promise.resolve({
      ok: true, status: 201, data: { links: [{ upload_id: 9, upload_type: 'file', token: 't' }] },
    }));
    actions.link.and.returnValue(Promise.resolve({ ok: true }));

    await new StaffCopyRunner(actions, onChange).run('items', 'target', [rows[0]]);

    const statuses = onChange.calls.allArgs().map(([run]) => run.entities[0].status);
    const linkStatuses = onChange.calls.allArgs().map(([run]) => run.entities[0].links[0]?.status);

    expect(statuses).toContain('copying');
    expect(linkStatuses).toContain('linking');
    expect(linkStatuses).toContain('pending');
  });

  it('maps entity failures and keeps going', async function() {
    actions.copy.and.returnValues(
      Promise.resolve({ ok: false, status: 404, data: null }),
      Promise.resolve({ ok: true, status: 201, data: { links: [] } }),
    );

    const result = await new StaffCopyRunner(actions, onChange).run('items', 'target', rows);

    expect(result.entities[0]).toEqual(jasmine.objectContaining({
      status: 'failed', reason: 'staff_copies_page.entity_error.not_found',
    }));
    expect(result.entities[1].status).toBe('copied');
    expect(actions.link).not.toHaveBeenCalled();
  });

  it('marks a failed link and does not stop the run', async function() {
    actions.copy.and.returnValue(Promise.resolve({
      ok: true,
      status: 201,
      data: { links: [{ upload_id: 1, upload_type: 'image', token: 'a' }, { upload_id: 2, upload_type: 'file', token: 'b' }] },
    }));
    actions.link.and.callFake(({ upload_id: uploadId }) => Promise.resolve({ ok: uploadId !== 1, status: uploadId === 1 ? 404 : 200 }));

    const result = await new StaffCopyRunner(actions, onChange).run('items', 'target', rows);

    expect(result.entities[0].links.map((link) => link.status)).toEqual(['failed', 'linked']);
    expect(result.entities[1].status).toBe('copied');
    expect(actions.link.calls.count()).toBe(4);
  });

  it('treats a copy without a links list as having no files', async function() {
    actions.copy.and.returnValue(Promise.resolve({ ok: true, status: 201, data: null }));

    const result = await new StaffCopyRunner(actions, onChange).run('items', 'target', [rows[0]]);

    expect(result.entities[0]).toEqual(jasmine.objectContaining({ status: 'copied', links: [] }));
  });
});
