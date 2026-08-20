import { useState } from 'react';

/**
 * Reusable hook bundling the money-edit modal's `show` state together with its
 * open/close/confirm handlers, so New/Edit character pages sharing the same `MoneyEditModal`
 * wiring don't each duplicate this bookkeeping. Parameterized by the field-state's `setField`
 * so it can write the confirmed total back into whichever form-state hook owns the `money`
 * field, without owning that field itself.
 *
 * @param {Function} setField - `setField(field, value)` setter from the page's form state
 *   (e.g. `useFormState`), used to write the confirmed total back into the `'money'` field.
 * @returns {{showMoneyModal: boolean, openMoneyModal: Function, closeMoneyModal: Function,
 *   confirmMoneyModal: Function}} `showMoneyModal` — whether the modal is open;
 *   `openMoneyModal` — opens the modal; `closeMoneyModal` — closes the modal without changes;
 *   `confirmMoneyModal(newTotal)` — writes the confirmed total into the `money` field and
 *   closes the modal.
 */
export default function useMoneyModal(setField) {
  const [showMoneyModal, setShowMoneyModal] = useState(false);

  return {
    showMoneyModal,
    openMoneyModal: () => setShowMoneyModal(true),
    closeMoneyModal: () => setShowMoneyModal(false),
    confirmMoneyModal: (newTotal) => {
      setField('money', String(newTotal));
      setShowMoneyModal(false);
    },
  };
}
