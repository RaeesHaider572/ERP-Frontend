import React, { useEffect, useState } from "react";
import { getLeaves, updateLeaveStatus } from "../../services/leaveService";

export default function LeaveList() {
    const [leaves, setLeaves] = useState([]);

    const fetchData = async () => {
        try {
            const res = await getLeaves();
            setLeaves(res.data);
        } catch (error) {
            console.error("Error fetching leaves:", error);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleStatus = async (id, status) => {
        try {
            await updateLeaveStatus(id, status);
            fetchData(); // refresh list after update
        } catch (error) {
            console.error("Error updating status:", error);
        }
    };

    return (
        <div style={{ padding: "20px" }}>
            <h2>Leave Requests</h2>

            {leaves.length === 0 ? (
                <p>No leave requests found</p>
            ) : (
                leaves.map((l) => (
                    <div
                        key={l.RequestID}
                        style={{
                            border: "1px solid #ddd",
                            margin: "10px 0",
                            padding: "10px",
                            borderRadius: "6px"
                        }}
                    >
                        <p><b>Employee:</b> {l.EmployeeID}</p>
                        <p><b>Status:</b> {l.Status}</p>

                        <button
                            onClick={() => handleStatus(l.RequestID, "Approved")}
                            style={{ marginRight: "10px" }}
                        >
                            Approve
                        </button>

                        <button
                            onClick={() => handleStatus(l.RequestID, "Rejected")}
                        >
                            Reject
                        </button>
                    </div>
                ))
            )}
        </div>
    );
}