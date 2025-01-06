const backend = process.env.NEXT_PUBLIC_BACKEND;

function send(method, url, data) {
  return fetch(`${backend}${url}`, {
    method: method,
    headers: { "Content-Type": "application/json" },
    body: data ? JSON.stringify(data) : null,
    credentials: "include",
  }).then((x) => x.json());
}

function sendFormData(method, url, formData) {
  return fetch(`${backend}${url}`, {
    method: method,
    body: formData,
    credentials: "include",
  })
    .then(async (response) => {
      const contentType = response.headers.get("Content-Type");
      if (contentType && contentType.includes("application/json")) {
        const json = await response.json();
        return json;
      } else {
        const text = await response.text();
        return text;
      }
    })
    .catch((error) => {
      console.error(`API call failed: ${method} ${url}`, error);
    });
}

export function signup(name, email, password, age) {
  return send("POST", "/api/auth/signup/", {
    type: "Native",
    name: name,
    email: email,
    password: password,
    age: age,
  });
}

export function signin(email, password) {
  return send("POST", "/api/auth/signin/", {
    type: "Native",
    email: email,
    password: password,
  });
}

export function signinGoogle() {
  window.location.href = `${backend}/api/auth/google`;
}

export function signout() {
  return send("POST", "/api/auth/signout/", null);
}

export function getUser() {
  return send("GET", "/api/auth/user/", null);
}

export function fetchBooks() {
  return send("GET", "/api/books/", null);
}

export function addBook(bookName) {
  return send("POST", "/api/books", { bookName });
}

export function deleteBook(bookId) {
  return send("DELETE", `/api/books/${bookId}`, null);
}

export function getDashboardData(bookId, range) {
  return send("GET", `/api/transactions/dashboard/${bookId}?range=${range}`);
}

export function getRecommendationsData(bookId) {
  return send("GET", `/api/transactions/recommendations/${bookId}`);
}

export function addBudgeting(
  budgetingType,
  goalAmount,
  refreshTime,
  relatedBookId,
) {
  return send("POST", "/api/budgetings/", {
    budgetingType,
    goalAmount,
    refreshTime,
    relatedBookId,
  });
}

export function getBudget(relatedBookId) {
  return send("GET", `/api/budgetings/budgets/one/${relatedBookId}`, null);
}

export function getGoal(relatedBookId) {
  return send("GET", `/api/budgetings/goals/one/${relatedBookId}`, null);
}

export function deleteBudgeting(budgetingId, relatedBookId) {
  return send("DELETE", `/api/budgetings/${budgetingId}`, {
    relatedBookId,
  });
}

export function addReport(reportType, relatedBookId) {
  return send("POST", "/api/reports", { reportType, relatedBookId });
}

export function generateWeeklyReports() {
  return send("POST", "/api/reports/weekly", null);
}

export function generateMonthlyReports() {
  return send("POST", "/api/reports/monthly", null);
}

export function getWeeklyReports(relatedBookId) {
  return send("GET", `/api/reports/weekly/${relatedBookId}`, null);
}

export function getMonthlyReports(relatedBookId) {
  return send("GET", `/api/reports/monthly/${relatedBookId}`, null);
}

export function deleteReport(relatedBookId, reportId) {
  return send("DELETE", `/api/reports/${reportId}`, {
    relatedBookId,
  });
}

export function getTransactionsByBookId(bookId, page, limit) {
  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });
  return send(
    "GET",
    `/api/transactions/book/${bookId}?${queryParams.toString()}`,
    null,
  );
}

export function deleteTransaction(transactionId) {
  return send("DELETE", `/api/transactions/${transactionId}`, null);
}

export function updateTransaction(transactionId, payload) {
  return send("PUT", `/api/transactions/${transactionId}`, payload);
}

export function addTransaction(transactionData) {
  return send("POST", "/api/transactions", transactionData);
}

export function addTransactionsBulk(transactions) {
  return send("POST", "/api/transactions/bulk", { transactions });
}

export function getCustomLabels(type) {
  return send("GET", `/api/custom-labels?type=${type}`, null);
}

export function addCustomLabel(labelName, type) {
  return send("POST", "/api/custom-labels", { labelName, type });
}

export function deleteCustomLabel(labelName, type) {
  return send("DELETE", "/api/custom-labels", { labelName, type });
}

export function uploadDocument(formData) {
  return sendFormData("POST", "/api/ocr/upload", formData);
}
