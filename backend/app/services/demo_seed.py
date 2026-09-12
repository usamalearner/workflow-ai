"""Realistic demo workspace.

Seeds a fully populated workspace (documents, chunks + embeddings, actions,
a conversation, a report and analytics) so judges see a live product, not an
empty shell. Every seeded record is flagged ``is_demo = True``.
"""

from __future__ import annotations

from datetime import date, timedelta

from app.services.documents import ParsedDocument, Page, chunk_document
from app.services.embeddings import embed_texts

_TODAY = date.today()


def _d(days: int) -> str:
    return (_TODAY + timedelta(days=days)).isoformat()


DEMO_DOCS: list[dict] = [
    {
        "original_filename": "Maintenance_Report.pdf",
        "file_type": "pdf",
        "file_size": 248_512,
        "pages": [
            "Wind Farm Weekly Maintenance Report — Week 37\n\n"
            "Site: Coastal Ridge Wind Farm. Reporting engineer: Maintenance Team.\n"
            "Overall fleet availability was 96.2% this week, down from 98.1% last week.\n"
            "Two turbines required unscheduled attention.",
            "Turbine WTG-3: Abnormal gearbox vibration was detected on the high-speed "
            "shaft during routine SCADA review. Vibration RMS reached 4.7 mm/s against "
            "an alarm threshold of 3.5 mm/s. The turbine was curtailed to 60% output "
            "as a precaution. The maintenance team must inspect the WTG-3 gearbox "
            "before returning it to normal operating conditions. Target date 12 "
            f"{_TODAY.strftime('%B')} {_TODAY.year}. Priority: high.",
            "Turbine WTG-7: Cooling system high-temperature alarm triggered twice "
            "overnight. Coolant level was found 15% below minimum. This is a critical "
            "issue — the maintenance team must resolve the cooling system alarm and "
            "top up coolant immediately to avoid a forced shutdown.",
            "Other items: The monthly energy production report is due for management "
            "review. Nacelle anemometer on WTG-1 shows a 3% calibration drift and "
            "should be recalibrated at the next convenient service window (low "
            "priority). Spare parts inventory for gearbox filters is low and should "
            "be replenished.",
        ],
    },
    {
        "original_filename": "Maintenance_SOP.pdf",
        "file_type": "pdf",
        "file_size": 191_004,
        "pages": [
            "Standard Operating Procedure — Turbine Drivetrain Inspection (SOP-MNT-014)\n"
            "Revision 6. Owner: Reliability Engineering.\n"
            "Purpose: define the required steps when abnormal vibration or temperature "
            "is detected on a wind turbine generator.",
            "Section 3 — Response to abnormal vibration. When vibration exceeds the "
            "alarm threshold, the turbine must be curtailed or stopped. A borescope "
            "inspection of the gearbox is mandatory before the unit returns to normal "
            "operating conditions. Oil sampling for particle count and ferrous debris "
            "must be completed within 48 hours.",
            "Section 5 — Cooling system faults. A coolant level below minimum is "
            "classified as critical. The turbine must not run above 50% load until "
            "coolant is restored and the circuit is pressure-tested. Record the "
            "corrective action in the CMMS.",
            "Section 8 — Documentation. Every intervention must be logged with the "
            "responsible owner, the completion date, and photographs. Deviations from "
            "this SOP require sign-off from the Reliability Engineering manager.",
        ],
    },
    {
        "original_filename": "Project_Meeting_Minutes.pdf",
        "file_type": "pdf",
        "file_size": 88_210,
        "pages": [
            "Project Phoenix — Weekly Steering Meeting Minutes\n"
            f"Date: {_d(-2)}. Attendees: Project Team, Operations Lead, Finance.\n"
            "1. Schedule: Phase 2 commissioning is tracking two weeks behind the "
            "baseline due to a delayed grid connection permit.",
            "2. Actions agreed: The project team will submit the revised grid "
            "connection application by "
            f"{_d(5)}. Finance will review the monthly energy report and confirm the "
            "revised budget forecast. Operations will schedule the WTG-3 gearbox "
            "inspection alongside the planned crane mobilisation to save cost.",
            "3. Risks: If the permit is not granted within three weeks, the Phase 2 "
            "revenue start date moves to the next quarter. Mitigation: escalate to "
            "the regulator through the external affairs contact.",
            "4. Next meeting: same time next week. The management brief should be "
            "circulated 24 hours in advance.",
        ],
    },
    {
        "original_filename": "Safety_Procedure.pdf",
        "file_type": "pdf",
        "file_size": 132_770,
        "pages": [
            "Site Safety Procedure — Working at Height and Lockout/Tagout (SAF-006)\n"
            "All personnel entering a turbine must complete the lockout/tagout "
            "checklist and confirm the rotor is locked before climbing.",
            "Emergency response: In the event of a fire alarm or cooling system "
            "failure, evacuate the nacelle immediately and account for all personnel "
            "at the muster point. Report the incident to the site manager within one "
            "hour.",
            "Permits: Hot work, confined space entry and high-voltage work each "
            "require a separate permit approved by the site safety officer before "
            "work begins.",
        ],
    },
]

DEMO_ACTIONS = [
    {
        "title": "Inspect WTG-3 gearbox vibration",
        "description": "Borescope inspection and oil sampling of the WTG-3 high-speed "
        "shaft gearbox before returning the turbine to full load. Vibration RMS "
        "4.7 mm/s vs 3.5 mm/s alarm threshold.",
        "owner": "Maintenance Team",
        "deadline": _d(2),
        "priority": "high",
        "status": "in_progress",
        "doc": "Maintenance_Report.pdf",
    },
    {
        "title": "Resolve cooling system alarm on WTG-7",
        "description": "Coolant level 15% below minimum, two overnight high-temp "
        "alarms. Top up coolant and pressure-test the circuit per SOP-MNT-014 "
        "Section 5.",
        "owner": "Maintenance Team",
        "deadline": _d(0),
        "priority": "critical",
        "status": "pending",
        "doc": "Maintenance_Report.pdf",
    },
    {
        "title": "Review monthly energy production report",
        "description": "Finance to review the monthly energy report and confirm the "
        "revised Phase 2 budget forecast.",
        "owner": "Finance Department",
        "deadline": _d(4),
        "priority": "medium",
        "status": "pending",
        "doc": "Project_Meeting_Minutes.pdf",
    },
    {
        "title": "Submit revised grid connection application",
        "description": "Project team to submit the revised grid connection permit "
        "application to unblock Phase 2 commissioning.",
        "owner": "Project Team",
        "deadline": _d(5),
        "priority": "high",
        "status": "pending",
        "doc": "Project_Meeting_Minutes.pdf",
    },
    {
        "title": "Recalibrate WTG-1 nacelle anemometer",
        "description": "3% calibration drift observed. Recalibrate at the next "
        "convenient service window.",
        "owner": "Maintenance Team",
        "deadline": _d(21),
        "priority": "low",
        "status": "pending",
        "doc": "Maintenance_Report.pdf",
    },
    {
        "title": "Replenish gearbox filter spare parts inventory",
        "description": "Stock of gearbox filters is below the reorder point.",
        "owner": "Procurement",
        "deadline": _d(10),
        "priority": "medium",
        "status": "pending",
        "doc": "Maintenance_Report.pdf",
    },
]


def seed(repo, user_id: str) -> None:
    if repo.is_seeded(user_id):
        return

    name_to_id: dict[str, str] = {}
    for spec in DEMO_DOCS:
        doc = repo.create_document(
            user_id,
            {
                "filename": spec["original_filename"],
                "original_filename": spec["original_filename"],
                "file_type": spec["file_type"],
                "file_size": spec["file_size"],
                "is_demo": True,
            },
        )
        parsed = ParsedDocument(
            pages=[Page(page_number=i + 1, text=t) for i, t in enumerate(spec["pages"])]
        )
        chunks = chunk_document(parsed, document_id=doc["id"], user_id=user_id)
        embeddings = embed_texts([c.content for c in chunks])
        repo.add_chunks(
            [
                {
                    "document_id": c.document_id,
                    "user_id": c.user_id,
                    "content": c.content,
                    "page_number": c.page_number,
                    "chunk_number": c.chunk_number,
                    "embedding": e,
                }
                for c, e in zip(chunks, embeddings)
            ]
        )
        repo.update_document(
            user_id,
            doc["id"],
            {
                "status": "ready",
                "page_count": parsed.page_count,
                "chunk_count": len(chunks),
            },
        )
        name_to_id[spec["original_filename"]] = doc["id"]
        repo.record_event(user_id, "documents_processed", 1)
        repo.record_event(user_id, "minutes_saved", 42)

    for a in DEMO_ACTIONS:
        repo.create_action(
            user_id,
            {
                "title": a["title"],
                "description": a["description"],
                "owner": a["owner"],
                "deadline": a["deadline"],
                "priority": a["priority"],
                "status": a["status"],
                "source_document_id": name_to_id.get(a["doc"]),
                "is_demo": True,
            },
        )
    repo.record_event(user_id, "actions_extracted", len(DEMO_ACTIONS))
    repo.record_event(user_id, "minutes_saved", 25 * len(DEMO_ACTIONS))

    conv = repo.create_conversation(user_id, "Critical issues this week")
    repo.add_message(user_id, conv["id"], "user", "What are the most critical issues in the latest maintenance report?")
    repo.add_message(
        user_id,
        conv["id"],
        "assistant",
        "The most critical issue is the cooling system high-temperature alarm on "
        "WTG-7, with coolant 15% below minimum [1]. The maintenance SOP classifies a "
        "coolant level below minimum as critical and limits the turbine to 50% load "
        "until the circuit is restored and pressure-tested [2]. A second high-priority "
        "issue is abnormal gearbox vibration on WTG-3 (4.7 mm/s vs a 3.5 mm/s alarm "
        "threshold), which requires a borescope inspection before the turbine returns "
        "to full load [1][2].",
        sources=[
            {
                "index": 1,
                "document_id": name_to_id["Maintenance_Report.pdf"],
                "filename": "Maintenance_Report.pdf",
                "page_number": 3,
                "chunk_number": 1,
                "snippet": "Cooling system high-temperature alarm triggered twice overnight. Coolant level 15% below minimum.",
                "score": 0.71,
            },
            {
                "index": 2,
                "document_id": name_to_id["Maintenance_SOP.pdf"],
                "filename": "Maintenance_SOP.pdf",
                "page_number": 3,
                "chunk_number": 1,
                "snippet": "A coolant level below minimum is classified as critical. The turbine must not run above 50% load until coolant is restored.",
                "score": 0.66,
            },
        ],
    )
    repo.record_event(user_id, "questions_answered", 1)
    repo.record_event(user_id, "minutes_saved", 15)

    repo.create_report(
        user_id,
        {
            "title": "Management Brief — Coastal Ridge Wind Farm",
            "report_type": "management_brief",
            "content": _DEMO_REPORT,
            "source_documents": [
                name_to_id["Maintenance_Report.pdf"],
                name_to_id["Project_Meeting_Minutes.pdf"],
            ],
            "source_filenames": ["Maintenance_Report.pdf", "Project_Meeting_Minutes.pdf"],
            "is_demo": True,
        },
    )
    repo.record_event(user_id, "reports_generated", 1)
    repo.record_event(user_id, "minutes_saved", 35)

    repo.mark_seeded(user_id)


_DEMO_REPORT = """# Management Brief — Coastal Ridge Wind Farm

## 1. Overview
This brief consolidates the Week 37 maintenance report and the latest Project
Phoenix steering minutes. Fleet availability fell to 96.2% (from 98.1%) driven by
two turbines requiring unscheduled attention.

## 2. Key Findings
- WTG-7 cooling system raised two overnight high-temperature alarms; coolant is
  15% below minimum. *(source: Maintenance_Report.pdf)*
- WTG-3 shows abnormal gearbox vibration at 4.7 mm/s against a 3.5 mm/s alarm
  threshold; output curtailed to 60%. *(source: Maintenance_Report.pdf)*
- Project Phoenix Phase 2 commissioning is two weeks behind due to a delayed grid
  connection permit. *(source: Project_Meeting_Minutes.pdf)*

## 3. Critical Issues
- Cooling system fault on WTG-7 (critical): risk of forced shutdown if coolant is
  not restored immediately.

## 4. Risks
- Revenue risk: if the grid permit is not granted within three weeks, Phase 2
  revenue slips to the next quarter.
- Reliability risk: running WTG-3 before inspection risks secondary gearbox damage.

## 5. Recommended Actions
- Restore WTG-7 coolant and pressure-test the circuit today (Maintenance Team).
- Complete the WTG-3 borescope inspection within 48 hours (Maintenance Team).
- Submit the revised grid connection application by the agreed date (Project Team).

## 6. Sources
- Maintenance_Report.pdf
- Project_Meeting_Minutes.pdf
- Maintenance_SOP.pdf
"""
