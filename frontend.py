import streamlit as st
import requests
import datetime

API_URL = "http://localhost:8000"

st.set_page_config(page_title="Banker App", layout="centered")

if 'token' not in st.session_state:
    st.session_state['token'] = None
if 'is_admin' not in st.session_state:
    st.session_state['is_admin'] = False
if 'username' not in st.session_state:
    st.session_state['username'] = None

st.title("🏦 Banker App")

# Helper for API requests
def api_post(endpoint, data, token=None):
    headers = {"Authorization": f"Bearer {token}"} if token else {}
    return requests.post(f"{API_URL}{endpoint}", json=data, headers=headers)

def api_get(endpoint, token=None, params=None):
    headers = {"Authorization": f"Bearer {token}"} if token else {}
    return requests.get(f"{API_URL}{endpoint}", headers=headers, params=params)

# Login/Register
with st.sidebar:
    st.header("Login / Register")
    if st.session_state['token']:
        st.success(f"Logged in as {st.session_state['username']}")
        if st.button("Logout"):
            st.session_state['token'] = None
            st.session_state['is_admin'] = False
            st.session_state['username'] = None
            st.info("Logged out. Please log in again.")
    else:
        tab = st.radio("Select", ["Login", "Register"])
        username = st.text_input("Username")
        password = st.text_input("Password", type="password")
        if tab == "Login":
            if st.button("Login"):
                resp = api_post("/login", {"username": username, "password": password})
                if resp.status_code == 200:
                    token = resp.json()['access_token']
                    import jwt
                    payload = jwt.decode(token, options={"verify_signature": False})
                    st.session_state['token'] = token
                    st.session_state['is_admin'] = payload.get('is_admin', False)
                    st.session_state['username'] = username
                    st.success("Logged in! Please refresh the page if you don't see your dashboard.")
                else:
                    st.error("Login failed")
        else:
            if st.button("Register"):
                resp = api_post("/register", {"username": username, "password": password})
                if resp.status_code == 200:
                    st.success("Registered! Please login.")
                else:
                    st.error("Registration failed")

if not st.session_state['token']:
    st.stop()

# Admin Dashboard
if st.session_state['is_admin']:
    st.header("Admin Panel")
    st.subheader("Create User and Account")
    new_username = st.text_input("New User Username")
    new_password = st.text_input("New User Password", type="password")
    is_admin = st.checkbox("Is Admin?")
    name = st.text_input("Name")
    father_name = st.text_input("Father's Name")
    phone_number = st.text_input("Phone Number")
    if st.button("Create User and Account"):
        resp = api_post("/admin/create_user_account", {
            "username": new_username,
            "password": new_password,
            "is_admin": is_admin,
            "name": name,
            "father_name": father_name,
            "phone_number": phone_number
        }, st.session_state['token'])
        if resp.status_code == 200:
            st.success("User and account created!")
        else:
            st.error(f"Failed to create user/account: {resp.json().get('detail', 'Unknown error')}")

    st.subheader("Add Money to Account")
    add_iban = st.text_input("IBAN to Add Money")
    add_amount = st.number_input("Amount to Add", min_value=0.01, step=0.01)
    if st.button("Add Money"):
        resp = api_post("/admin/add_money", {"iban": add_iban, "amount": add_amount}, st.session_state['token'])
        if resp.status_code == 200:
            st.success(f"{resp.json()['message']} (New Balance: {resp.json()['new_balance']})")
        else:
            st.error(f"Failed to add money: {resp.json().get('detail', 'Unknown error')}")

    st.subheader("View All Accounts")
    if st.button("Show All Accounts"):
        resp = api_get("/admin/all_accounts", st.session_state['token'])
        if resp.status_code == 200:
            accounts = resp.json()
            for acc in accounts:
                st.write(f"ID: {acc['id']} | Name: {acc['name']} | IBAN: {acc['iban']} | Address: {acc['address']} | Balance: {acc['balance']}")
        else:
            st.error("Failed to fetch accounts")

    st.subheader("View Account Details")
    acc_id = st.number_input("Account ID", min_value=1, step=1)
    if st.button("View Account"):
        resp = api_get(f"/admin/account/{acc_id}", st.session_state['token'])
        if resp.status_code == 200:
            acc = resp.json()
            st.write(acc)
        else:
            st.error("Account not found")
    st.subheader("Bank Stats")
    if st.button("Total Money in Bank"):
        resp = api_get("/admin/total_money", st.session_state['token'])
        if resp.status_code == 200:
            st.info(f"Total Money: {resp.json()['total_money']}")
    if st.button("Total Transferred Today"):
        resp = api_get("/admin/total_transferred_today", st.session_state['token'])
        if resp.status_code == 200:
            st.info(f"Total Transferred Today: {resp.json()['total_transferred_today']}")

# User Dashboard
if not st.session_state['is_admin']:
    st.header("Your Account")
    resp = api_get("/accounts", st.session_state['token'])
    if resp.status_code == 200 and resp.json():
        acc = resp.json()[0]
        st.write(f"Name: {acc['name']} | Father's Name: {acc['father_name']} | Phone: {acc['phone_number']} | IBAN: {acc['iban']} | Address: {acc['address']} | Balance: {acc.get('balance', 0.0)}")
    else:
        st.info("No account found. Please contact your bank admin.")

    st.header("Send Money")
    with st.form("send_money"):
        to_iban = st.text_input("Recipient IBAN (optional)")
        to_address = st.text_input("Recipient Address (optional)")
        amount = st.number_input("Amount", min_value=0.01, step=0.01)
        submitted = st.form_submit_button("Send")
        if submitted:
            data = {"to_iban": to_iban or None, "to_address": to_address or None, "amount": amount}
            resp = api_post("/transfer", data, st.session_state['token'])
            if resp.status_code == 200:
                st.success("Transfer successful! Please refresh the page to see updated balances.")
            else:
                st.error(f"Transfer failed: {resp.json().get('detail', 'Unknown error')}")

    st.header("Beneficiaries")
    resp = api_get("/beneficiaries", st.session_state['token'])
    if resp.status_code == 200:
        beneficiaries = resp.json()
        for b in beneficiaries:
            st.write(f"{b['name']} | IBAN: {b['iban']} | Address: {b['address']}")
    with st.expander("Add Beneficiary"):
        name = st.text_input("Beneficiary Name")
        ben_iban = st.text_input("Beneficiary IBAN")
        ben_address = st.text_input("Beneficiary Address")
        if st.button("Add Beneficiary"):
            resp = api_post("/beneficiaries", {"name": name, "iban": ben_iban, "address": ben_address}, st.session_state['token'])
            if resp.status_code == 200:
                st.success("Beneficiary added! Please refresh the page to see your new beneficiary.")
            else:
                st.error("Failed to add beneficiary")

    st.header("Expense Logs")
    period = st.selectbox("Period", ["all", "daily", "weekly"])
    params = {"period": period if period != "all" else None}
    resp = api_get("/transactions", st.session_state['token'], params=params)
    if resp.status_code == 200:
        txs = resp.json()
        for tx in txs:
            st.write(f"{tx['timestamp']} | {tx['type']} | {tx['amount']} | To IBAN: {tx.get('to_iban', '')} | To Address: {tx.get('to_address', '')}")
    else:
        st.info("No transactions found.") 