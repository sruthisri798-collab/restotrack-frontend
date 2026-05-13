export default function WorkflowDrawer({
  workflow,
  onClose,
}) {

  if (!workflow) return null;

  return (
    <div className="w-[420px] h-full bg-white border-l flex flex-col overflow-y-auto">

      {/* HEADER */}
      <div className="p-6 border-b flex items-start justify-between sticky top-0 bg-white z-10">

        <div>

          <h2 className="text-3xl font-bold">
            ${workflow.amount || workflow.receipt?.amount || "0.00"}
          </h2>

          <p className="text-xl font-semibold mt-1">
            {workflow.vendor ||
              workflow.merchant ||
              workflow.receipt?.vendor}
          </p>

          <div className="flex gap-2 mt-3 flex-wrap">

            <span className="px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-sm">
              {workflow.priority || "medium"}
            </span>

            <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-sm">
              {workflow.status}
            </span>

          </div>

        </div>

        <button
          onClick={onClose}
          className="text-2xl text-gray-500 hover:text-black"
        >
          ×
        </button>

      </div>


      {/* WORKFLOW EXPLANATION */}
      <div className="px-6 pt-6 pb-5">

        <div
          className={`
            border border-gray-200 rounded-2xl shadow-sm p-5

            ${(workflow.status === "pending_receipt" ||
              workflow.status === "critical_missing_receipt")
              ? "bg-red-50 border-red-200"

              : (workflow.status === "pending_transaction_sync" ||
                workflow.status === "orphan_receipt")
              ? "bg-orange-50 border-orange-200"

              : "bg-yellow-50 border-yellow-200"
            }
          `}
        >

          {/* MISSING */}
          {(workflow.status === "pending_receipt" ||
            workflow.status === "critical_missing_receipt") && (

            <p className="text-red-900 leading-7">
              No receipt has been uploaded for this transaction.
              Upload receipt or resolve manually.
            </p>

          )}

          {/* ORPHAN */}
          {(workflow.status === "pending_transaction_sync" ||
            workflow.status === "orphan_receipt") && (

            <p className="text-orange-900 leading-7">
              Receipt was uploaded but no matching transaction
              was found yet. This may be a settlement delay.
            </p>

          )}

          {/* REVIEW */}
          {(workflow.status === "needs_manual_review" ||
            workflow.status === "awaiting_clarification") && (

            <p className="text-yellow-900 leading-7">
              This workflow requires human review before
              reconciliation can be completed.
            </p>

          )}

        </div>

      </div>


      {/* WORKFLOW SUMMARY */}
      <div className="px-6 pb-5">

        <div className="border border-gray-200 rounded-2xl shadow-sm p-5 bg-gray-50">

          <h3 className="text-sm font-semibold text-gray-900 mb-4">
            Workflow Summary
          </h3>

          <div className="space-y-3 text-sm">

            <div className="flex justify-between">
              <span className="text-gray-500">
                Workflow State
              </span>

              <span>
                Open
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-500">
                Scenario
              </span>

              <span>
                {workflow.scenario_type || "general"}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-500">
                Created
              </span>

              <span>
                {workflow.created_at
                  ? new Date(workflow.created_at).toLocaleDateString()
                  : "—"}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-500">
                Assigned To
              </span>

              <span>
                {workflow.assigned_to || "Unassigned"}
              </span>
            </div>

          </div>

        </div>

      </div>


      {/* WORKFLOW DETAILS */}
      <div className="px-6 pb-5">

        {/* MISSING */}
        {(workflow.status === "pending_receipt" ||
          workflow.status === "critical_missing_receipt") && (

          <div className="border border-gray-200 rounded-2xl shadow-sm p-5">

            <h3 className="text-sm font-semibold text-gray-900 mb-4">
              Transaction
            </h3>

            <div className="space-y-2 text-sm">

              <div className="flex justify-between">
                <span className="text-gray-500">Vendor</span>

                <span>
                  {workflow.vendor || workflow.merchant}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-500">Amount</span>

                <span>
                  ${workflow.amount || "0.00"}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-500">Days Pending</span>

                <span>
                  {workflow.days_pending || 0}
                </span>
              </div>

            </div>

          </div>

        )}


        {/* ORPHAN */}
        {(workflow.status === "pending_transaction_sync" ||
          workflow.status === "orphan_receipt") && (

          <div className="border border-gray-200 rounded-2xl shadow-sm p-5">

            <h3 className="text-sm font-semibold text-gray-900 mb-4">
              Uploaded Receipt
            </h3>

            <div className="space-y-2 text-sm">

              <div className="flex justify-between">
                <span className="text-gray-500">Vendor</span>

                <span>
                  {workflow.receipt?.vendor}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-500">Amount</span>

                <span>
                  ${workflow.receipt?.amount || "0.00"}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-500">Workflow</span>

                <span>
                  Waiting for transaction sync
                </span>
              </div>

            </div>

          </div>

        )}


        {/* REVIEW */}
        {(workflow.status === "needs_manual_review" ||
          workflow.status === "awaiting_clarification") && (

          <div className="border border-gray-200 rounded-2xl shadow-sm p-5">

            <h3 className="text-sm font-semibold text-gray-900 mb-4">
              Review Details
            </h3>

            <div className="space-y-2 text-sm">

              <div className="flex justify-between">
                <span className="text-gray-500">Confidence</span>

                <span>
                  {workflow.score || 0}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-500">Status</span>

                <span>
                  Human review required
                </span>
              </div>

            </div>

          </div>

        )}

      </div>


      {/* CANDIDATE MATCH */}
      {(workflow.status === "needs_manual_review" ||
        workflow.status === "awaiting_clarification") && (

        <div className="px-6 pb-5">

          <div className="border border-gray-200 rounded-2xl shadow-sm p-5">

            <h3 className="text-sm font-semibold text-gray-900 mb-4">
              Candidate Match
            </h3>

            <div className="space-y-3 text-sm">

              <div className="flex justify-between">
                <span className="text-gray-500">
                  Possible Vendor
                </span>

                <span>
                  {workflow.vendor || "Unknown"}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-500">
                  Confidence Score
                </span>

                <span>
                  {workflow.score || 0}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-500">
                  Match Reason
                </span>

                <span>
                  Vendor/date partially matched
                </span>
              </div>

            </div>

          </div>

        </div>

      )}


      {/* REVIEWER NOTES */}
      <div className="px-6 pb-5">

        <div className="border border-gray-200 rounded-2xl shadow-sm p-5">

          <h3 className="text-sm font-semibold text-gray-900 mb-4">
            Reviewer Notes
          </h3>

          <textarea
            placeholder="Add operational notes..."
            className="
              w-full
              min-h-[120px]
              border
              rounded-xl
              p-4
              text-sm
              resize-none
              outline-none
            "
          />

        </div>

      </div>


      {/* WORKFLOW TIMELINE */}
      <div className="px-6 pb-5">

        <div className="border border-gray-200 rounded-2xl shadow-sm p-5">

          <h3 className="text-sm font-semibold text-gray-900 mb-5">
            Workflow Activity
          </h3>

          <div className="space-y-5 text-sm">

            <div className="flex gap-3">

              <div className="w-2 h-2 rounded-full bg-gray-400 mt-2"></div>

              <div>
                <div className="font-medium">
                  Workflow created
                </div>

                <div className="text-gray-500 text-xs mt-1">
                  {workflow.created_at
                    ? new Date(workflow.created_at).toLocaleString()
                    : "Unknown"}
                </div>
              </div>

            </div>


            {(workflow.status === "needs_manual_review" ||
              workflow.status === "awaiting_clarification") && (

              <div className="flex gap-3">

                <div className="w-2 h-2 rounded-full bg-yellow-500 mt-2"></div>

                <div>
                  <div className="font-medium">
                    Sent for human review
                  </div>

                  <div className="text-gray-500 text-xs mt-1">
                    AI confidence below reconciliation threshold
                  </div>
                </div>

              </div>

            )}


            {(workflow.status === "pending_transaction_sync" ||
              workflow.status === "orphan_receipt") && (

              <div className="flex gap-3">

                <div className="w-2 h-2 rounded-full bg-orange-500 mt-2"></div>

                <div>
                  <div className="font-medium">
                    Waiting for transaction sync
                  </div>

                  <div className="text-gray-500 text-xs mt-1">
                    Receipt uploaded before transaction settlement
                  </div>
                </div>

              </div>

            )}

          </div>

        </div>

      </div>


      {/* FOOTER */}
      <div className="mt-auto border-t p-5 flex flex-col gap-3 bg-white sticky bottom-0">

        {/* MISSING */}
        {(workflow.status === "pending_receipt" ||
          workflow.status === "critical_missing_receipt") && (

          <>
            <button className="w-full bg-black text-white rounded-xl py-3">
              Upload Receipt
            </button>

            <button className="w-full border rounded-xl py-3">
              Enter Manually
            </button>

            <button className="w-full border rounded-xl py-3">
              Escalate
            </button>
          </>

        )}


        {/* ORPHAN */}
        {(workflow.status === "pending_transaction_sync" ||
          workflow.status === "orphan_receipt") && (

          <>
            <button className="w-full bg-black text-white rounded-xl py-3">
              Wait For Sync
            </button>

            <button className="w-full border rounded-xl py-3">
              Assign Review
            </button>

            <button className="w-full border rounded-xl py-3">
              Close Orphan
            </button>
          </>

        )}


        {/* REVIEW */}
        {(workflow.status === "needs_manual_review" ||
          workflow.status === "awaiting_clarification") && (

          <>
            <button className="w-full bg-black text-white rounded-xl py-3">
              Confirm Match
            </button>

            <button className="w-full border rounded-xl py-3">
              Reject Match
            </button>

            <button className="w-full border rounded-xl py-3">
              Escalate
            </button>
          </>

        )}

      </div>

    </div>
  );
}