//file: dashboard.js
// used by dashboard.html to fetch users from the database
// and udpate HTML table with user data

async function fetchUsers() {
    const limitInput = document.getElementById("rowLimit");
    const rowLimit = parseInt(limitInput.value) || 1000;

    const response = await fetch(`/api/users?limit=${rowLimit}`, { credentials: "include" });
    //const response = await fetch("/api/users", { credentials: "include" });
    const users = await response.json();

    if (response.ok) {
        // get HTML table (going to modify this)
        const userTable = document.getElementById("userList");
        userTable.innerHTML = ""; // clear the previous content of the table

        // for each user in result, create table row and append to table in DOM
        users.forEach(user => {  
            const row = document.createElement("tr");
            row.innerHTML = `<td>${user.username}</td><td>${user.email}</td><td>${user.role}</td>`;
            userTable.appendChild(row);
        });

    } else {
        alert("Unauthorized access! - remove this alert from dashboard.js (line:18) when 'done'"); // comment this out when confident
        window.location.href = "/frontpage.html";
    }
}

fetchUsers();

document.addEventListener("DOMContentLoaded", () => {
  const button = document.getElementById("displayButton");
  if (!button) {
    console.error("displayButton not found in DOM");
    return;
  }
  button.addEventListener("click", fetchUsers);
});

document.getElementById("insertRow").addEventListener("click", async () => {
    const confirmed = confirm("Are you sure you want to add these values to the table?");
    if (!confirmed) {
        return;
    }
    const username = document.getElementById("col1").value;
    const email = document.getElementById("col2").value;
    const role = document.getElementById("col3").value;
  
    const response = await fetch("/api/users/insert-row", {method: "POST", credentials: "include", headers: {"Content-Type": "application/json"},
      body: JSON.stringify({ username, email, role })
    });

    if (response.ok) {
      alert("Row inserted successfully!");
      fetchUsers(); // refresh table
    } else {
      alert("Failed to insert row.");
    }
  });
  

document.getElementById("truncateButton").addEventListener("click", async () => {
    const confirmed = confirm("Are you sure you want to truncate the table? This cannot be undone.");
    if (!confirmed) {
        return;
    }
    const response = await fetch("/api/users/truncate", {method: "POST", credentials: "include"});

    if (response.ok) {
        alert("Table truncated successfully!");
        fetchUsers(); // refresh the table
    } else {
        alert("Failed to truncate the table.");
    }
});