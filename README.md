# CampusConnect

### Smarter Campus Deliveries. Faster Parcel Resolution.

CampusConnect started with a simple observation: **finding a parcel should not take longer than handing it over.**

On a busy campus, delivery partners may arrive with dozens of packages while students are attending classes, labs, or other activities. Finding the right parcel and coordinating a successful handover can become time-consuming. When a student is unavailable, the parcel may need another delivery attempt, and the process becomes harder to manage.

CampusConnect explores how a simple, centralized system can make this part of the delivery process more organized.

The platform brings students, delivery personnel, and campus operators together to help identify parcels, record handover outcomes, and manage deliveries that need further attention.

> **Project note:** CampusConnect is an independent student project developed for educational and demonstration purposes. It is not affiliated with, sponsored by, or endorsed by Amazon or any other e-commerce company.

## Why CampusConnect?

Most customers can already track an online order. The challenge this project focuses on is a little different: **what happens when a large number of parcels reach a campus at the same time, or when the intended recipient is unavailable?**

Manual searching, repeated follow-ups, and unclear delivery statuses can make parcel handovers less efficient than they need to be.

CampusConnect focuses on three practical goals:

* Help delivery personnel find the correct parcel without searching through packages one by one.
* Give students clearer visibility into their parcel status and available next steps.
* Help campus operators keep track of unresolved deliveries instead of leaving them scattered across manual records.

## How it works

CampusConnect is designed around three roles, each with a different responsibility.

### Student Portal

Students can check the status of their parcels and view relevant updates. Where the workflow supports it, they can choose an available pickup point or request a suitable redelivery option.

### Delivery Person Dashboard

Delivery personnel can search parcel records using tracking IDs, order references, or recipient details. They can view relevant delivery information, record successful handovers, and document unsuccessful attempts.

When a handover fails, the parcel can move into a recovery workflow rather than simply disappearing from the active delivery view.

### Campus Operator Dashboard

Campus operators can oversee parcel records, monitor unresolved cases, manage available pickup points, and review activity across the system.

The aim is to give operators a clearer picture of what has been completed and what still requires attention.

## Features

* **Parcel Search:** Find relevant parcel records using supported identifiers and recipient details.
* **Batch Management:** Organize parcel records into delivery batches.
* **Barcode-Assisted Lookup:** Support scanning where available, with manual search as a fallback.
* **Handover Tracking:** Record successful and unsuccessful delivery attempts.
* **Failed-Delivery Recovery:** Keep unresolved parcels visible and support eligible pickup, redelivery, or escalation actions.
* **Role-Based Portals:** Provide separate experiences for students, delivery personnel, and campus operators.
* **Operational Dashboard:** Present useful summaries based on the records available to the system.
* **CSV Import:** Validate uploaded files, identify duplicate records, and report import errors.
* **Activity History:** Maintain a record of relevant actions and status changes.
* **Data Analytics:** Explore historical order and delivery patterns using the available dataset.

## A look at the data

CampusConnect uses the Olist Brazilian E-Commerce dataset from Kaggle for relevant historical e-commerce analysis.

The dataset contains related records that can help explore order activity, customer and seller relationships, product information, and delivery patterns, depending on the files and fields available.

These records are useful for understanding historical e-commerce activity, but they are not actual campus delivery records. They do not automatically tell us which campus driver handled a parcel, whether a student collected it, or whether a hostel handover failed.

For that reason, historical analysis and campus operations are treated separately. Operational metrics should come from actual recorded events, while any generated records used for testing should be clearly identified as demonstration data.

## Technology

CampusConnect is built using a web-based architecture.

| Component       | Technologies                         |
| --------------- | ------------------------------------ |
| Frontend        | React, TypeScript, Vite              |
| UI and Charts   | Tailwind CSS, Lucide Icons, Recharts |
| Backend         | Python, FastAPI, Pydantic            |
| Database        | SQLite, SQLAlchemy                   |
| Data Processing | CSV, Pandas where needed             |

The frontend provides the role-specific dashboards, while the backend handles requests, validates data, and manages the application's business rules and persistent records.

## The goal

The goal of CampusConnect is not to replace existing e-commerce tracking systems. It is to explore a smaller but meaningful part of the delivery journey: **the last few steps between a parcel reaching campus and reaching the right person.**

By making parcel identification easier and unsuccessful handovers easier to manage, CampusConnect aims to make campus delivery operations more organized, transparent, and measurable.

---

*Built as an independent student project exploring practical logistics challenges through software engineering and data-driven analysis.*
