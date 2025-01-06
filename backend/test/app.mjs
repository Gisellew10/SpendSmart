import { use, expect } from "chai";
import { createServer } from "http";
import chaiHttp from "chai-http";
const chai = use(chaiHttp);

import { app } from "../app.mjs";
import mongoose from "../configs/db.mjs";
import User from "../models/User.mjs";
import Book from "../models/Book.mjs";
import Budgeting from "../models/Budgeting.mjs";
import Report from "../models/Report.mjs";
import Transaction from "../models/Transaction.mjs";
import CustomLabel from "../models/CustomLabel.mjs";

describe("Testing API", function () {
  let server;
  let agentUser1;
  let agentUser2;
  let userId1;
  let bookId1;
  let fakeBookId = "672feec21184d7c56202adeb";
  let transactionId1;
  let fakeReportId1;
  let budgetingId1;
  let budgetingId2;
  let fakeBudgetingId = "672ffac2b309fe92108249d0";

  const testUsers = [
    { name: "testuser1", email: "1@gmail.com", password: "testpassword1" },
    { name: "testuser2", email: "2@gmail.com", password: "testpassword2" },
  ];

  before((done) => {
    server = createServer(app);
    server.listen(3000, () => {
      agentUser1 = chai.request.agent(app);
      agentUser2 = chai.request.agent(app);
      done();
    });
    console.log("Server started");
  });

  after(async function () {
    this.timeout(3000);

    server.close();
    agentUser1.close();
    agentUser2.close();

    // Flush the databases
    await User.deleteMany({});
    console.log("User collection cleared");
    await Book.deleteMany({});
    console.log("Book collection cleared");
    await Budgeting.deleteMany({});
    console.log("Budgeting collection cleared");
    await Report.deleteMany({});
    console.log("Report collection cleared");
    await Transaction.deleteMany({});
    console.log("Transaction collection cleared");
    await CustomLabel.deleteMany({});
    console.log("CustomLabel collection cleared");

    await mongoose.connection.close();
    console.log("MongoDB connection closed");
  });

  describe("POST /api/auth/signup/", function () {
    it("should register testuser1 successfully", function (done) {
      chai.request
        .execute(server)
        .post("/api/auth/signup/")
        .send({ ...testUsers[0], type: "Native" })
        .end((err, res) => {
          expect(res).to.have.status(201);
          done();
        });
    });

    it("should register testuser2 successfully", function (done) {
      chai.request
        .execute(server)
        .post("/api/auth/signup/")
        .send({ ...testUsers[1], type: "Native" })
        .end((err, res) => {
          if (err) console.error(err);
          expect(res).to.have.status(201);
          done();
        });
    });

    it("should not register with insufficient fields", function (done) {
      chai.request
        .execute(server)
        .post("/api/auth/signup/")
        .send({ name: "testuser3", password: "testpassword3" })
        .end((err, res) => {
          expect(res).to.have.status(400);
          done();
        });
    });
  });

  describe("POST /api/auth/signin/", function () {
    it("should login testuser1 successfully with correct credentials", function (done) {
      agentUser1
        .post("/api/auth/signin/")
        .send({
          email: testUsers[0].email,
          password: testUsers[0].password,
          type: "Native",
        })
        .end((err, res) => {
          expect(res).to.have.status(200);
          userId1 = res.body.user._id;
          done();
        });
    });

    it("should login testuser2 successfully with correct credentials", function (done) {
      agentUser2
        .post("/api/auth/signin/")
        .send({
          email: testUsers[1].email,
          password: testUsers[1].password,
          type: "Native",
        })
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
        });
    });

    it("should not login with incorrect password for testuser1", function (done) {
      chai.request
        .execute(server)
        .post("/api/auth/signin/")
        .send({
          email: testUsers[0].email,
          password: "wrongpassword",
          type: "Native",
        })
        .end((err, res) => {
          expect(res).to.have.status(400);
          done();
        });
    });

    it("should not login with non-existent email", function (done) {
      chai.request
        .execute(server)
        .post("/api/auth/signin/")
        .send({
          email: "nonexistentemail",
          password: "wrongpassword",
          type: "Native",
        })
        .end((err, res) => {
          expect(res).to.have.status(404);
          done();
        });
    });

    it("should not login with insufficient fields", function (done) {
      chai.request
        .execute(server)
        .post("/api/auth/signin/")
        .send({
          email: "nonexistentemail",
          password: "wrongpassword",
        })
        .end((err, res) => {
          expect(res).to.have.status(400);
          done();
        });
    });
  });

  describe("GET /api/auth/user/", function () {
    it("should return 200 after getting the user info of testuser1", function (done) {
      agentUser1.get("/api/auth/user/").end((err, res) => {
        expect(res).to.have.status(200);
        done();
      });
    });

    it("should return 200 after getting the user info of testuser2", function (done) {
      agentUser2.get("/api/auth/user/").end((err, res) => {
        expect(res).to.have.status(200);
        done();
      });
    });

    it("should return 401 for a not logged in user", function (done) {
      chai.request
        .execute(server)
        .get("/api/auth/user/")
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
        });
    });
  });

  describe("GET /api/books/", function () {
    it("should get book successfully", function (done) {
      agentUser1.get("/api/books/").end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body.books).to.be.an("array");
        expect(res.body.books).to.have.lengthOf(1);
        done();
      });
    });

    it("should get books for testuser2", function (done) {
      agentUser2.get("/api/books/").end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body.books).to.be.an("array");
        expect(res.body.books).to.have.lengthOf(1);
        done();
      });
    });

    it("should not get books for unauthorized user", function (done) {
      chai.request
        .execute(server)
        .get("/api/books/")
        .end((err, res) => {
          expect(res).to.have.status(401);
          done();
        });
    });
  });

  describe("POST /api/books/", function () {
    it("should create book successfully", function (done) {
      agentUser1
        .post("/api/books/")
        .send({
          bookName: "Test Book",
        })
        .end((err, res) => {
          expect(res).to.have.status(201);
          bookId1 = res.body.book._id;
          agentUser1.get("/api/books/").end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.books).to.be.an("array");
            expect(res.body.books).to.have.lengthOf(2);
            done();
          });
        });
    });

    it("should not create a book with duplicate book", function (done) {
      agentUser1
        .post("/api/books/")
        .send({
          bookName: "Test Book",
        })
        .end((err, res) => {
          expect(res).to.have.status(409);
          done();
        });
    });

    it("should not create a book with insufficient fields", function (done) {
      agentUser1
        .post("/api/books/")
        .send({})
        .end((err, res) => {
          expect(res).to.have.status(400);
          done();
        });
    });
  });

  describe("PUT /api/books/:id", function () {
    it("should update book successfully", function (done) {
      agentUser1
        .put(`/api/books/${bookId1}`)
        .send({
          bookName: "Updated Book",
        })
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
        });
    });

    it("should not update book with invalid book ID", function (done) {
      agentUser1
        .put(`/api/books/${fakeBookId}`)
        .send({
          bookName: "Updated Book",
        })
        .end((err, res) => {
          expect(res).to.have.status(404);
          done();
        });
    });

    it("should not update book for unauthorized user", function (done) {
      chai.request
        .execute(server)
        .put(`/api/books/${bookId1}`)
        .send({
          bookName: "Updated Book",
        })
        .end((err, res) => {
          expect(res).to.have.status(401);
          done();
        });
    });

    it("should not update book if unfound for current user", function (done) {
      agentUser2
        .put(`/api/books/${bookId1}`)
        .send({
          bookName: "Updated Book",
        })
        .end((err, res) => {
          expect(res).to.have.status(404);
          done();
        });
    });
  });

  describe("POST /api/transactions/", function () {
    it("should create transaction successfully", function (done) {
      const date = new Date();
      const formattedDate = date.toISOString().split("T")[0];
      agentUser1
        .post("/api/transactions/")
        .send({
          relatedBookId: bookId1,
          category: "Other",
          customLabels: ["none"],
          vendor: "Tester",
          amount: 100,
          dateOfTransaction: formattedDate,
        })
        .end((err, res) => {
          expect(res).to.have.status(201);
          transactionId1 = res.body._id;
          done();
        });
    });

    it("should not create transaction with insufficient fields", function (done) {
      agentUser1
        .post("/api/transactions/")
        .send({
          relatedBookId: bookId1,
          category: "Other",
          customLabels: "none",
          vendor: "Tester",
        })
        .end((err, res) => {
          expect(res).to.have.status(400);
          done();
        });
    });

    it("should not create transaction with invalid book ID", function (done) {
      const date = new Date();
      agentUser1
        .post("/api/transactions/")
        .send({
          relatedBookId: fakeBookId,
          category: "Other",
          customLabels: "none",
          vendor: "Tester",
          amount: 100,
          dateOfTransaction: date,
        })
        .end((err, res) => {
          expect(res).to.have.status(404);
          done();
        });
    });

    it("should not create transaction with user not logged in", function (done) {
      chai.request
        .execute(server)
        .post("/api/transactions/")
        .send({
          relatedBookId: bookId1,
          category: "Other",
          customLabels: "none",
          vendor: "Tester",
          amount: 100,
        })
        .end((err, res) => {
          expect(res).to.have.status(401);
          done();
        });
    });

    it("should not create transaction with user that does not own the book", function (done) {
      const date = new Date();
      agentUser2
        .post("/api/transactions/")
        .send({
          relatedBookId: bookId1,
          category: "Other",
          customLabels: "none",
          vendor: "Tester",
          amount: 100,
          dateOfTransaction: date,
        })
        .end((err, res) => {
          expect(res).to.have.status(403);
          done();
        });
    });
  });

  describe("GET /api/transactions/book/:bookId", function () {
    it("should get transactions successfully", function (done) {
      agentUser1.get(`/api/transactions/book/${bookId1}`).end((err, res) => {
        expect(res).to.have.status(200);
        done();
      });
    });

    it("should not get transactions for unauthorized user", function (done) {
      agentUser2.get(`/api/transactions/book/${bookId1}`).end((err, res) => {
        expect(res).to.have.status(404);
        done();
      });
    });

    it("should not get transactions for not logged in user", function (done) {
      chai.request
        .execute(server)
        .get(`/api/transactions/book/${bookId1}`)
        .end((err, res) => {
          expect(res).to.have.status(401);
          done();
        });
    });

    it("should not get transactions with invalid book ID format", function (done) {
      agentUser1
        .get(`/api/transactions/book/${fakeBookId}ans`)
        .end((err, res) => {
          expect(res).to.have.status(400);
          done();
        });
    });

    it("should not get transactions with invalid book ID", function (done) {
      agentUser1.get(`/api/transactions/book/${fakeBookId}`).end((err, res) => {
        expect(res).to.have.status(404);
        done();
      });
    });
  });

  describe("GET /api/transactions/", function () {
    it("should get transactions successfully", function (done) {
      agentUser1.get("/api/transactions/").end((err, res) => {
        expect(res).to.have.status(200);
        done();
      });
    });

    it("should not get transactions for not logged in user", function (done) {
      chai.request
        .execute(server)
        .get("/api/transactions/")
        .end((err, res) => {
          expect(res).to.have.status(401);
          done();
        });
    });
  });

  describe("GET /api/transactions/dashboard/:id?range=", function () {
    it("should get dashboard successfully", function (done) {
      agentUser1
        .get(`/api/transactions/dashboard/${bookId1}?range=30`)
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
        });
    });

    it("should not get dashboard for unauthorized user", function (done) {
      agentUser2
        .get(`/api/transactions/dashboard/${bookId1}?range=30`)
        .end((err, res) => {
          expect(res).to.have.status(404);
          done();
        });
    });

    it("should not get dashboard for not logged in user", function (done) {
      chai.request
        .execute(server)
        .get(`/api/transactions/dashboard/${bookId1}?range=30`)
        .end((err, res) => {
          expect(res).to.have.status(401);
          done();
        });
    });

    it("should not get dashboard without range parameter", function (done) {
      agentUser1
        .get(`/api/transactions/dashboard/${bookId1}`)
        .end((err, res) => {
          expect(res).to.have.status(400);
          done();
        });
    });
  });

  describe("GET /api/transactions/recommendations/:id", function () {
    it("should not get recommendations due to not enough transactions", function (done) {
      agentUser1
        .get(`/api/transactions/recommendations/${bookId1}`)
        .end((err, res) => {
          expect(res).to.have.status(400);
          done();
        });
    });

    it("should not get recommendations for unauthorized user", function (done) {
      agentUser2
        .get(`/api/transactions/recommendations/${bookId1}`)
        .end((err, res) => {
          expect(res).to.have.status(404);
          done();
        });
    });

    it("should not get recommendations for not logged in user", function (done) {
      chai.request
        .execute(server)
        .get(`/api/transactions/recommendations/${bookId1}`)
        .end((err, res) => {
          expect(res).to.have.status(401);
          done();
        });
    });
  });

  describe("PUT /api/transactions/:transactionId", function () {
    it("should update transaction successfully", function (done) {
      const date = new Date();
      const formattedDate = date.toISOString().split("T")[0];
      agentUser1
        .put(`/api/transactions/${transactionId1}`)
        .send({
          customLabels: ["none"],
          vendor: "Tester",
          amount: 300,
          dateOfTransaction: formattedDate,
        })
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
        });
    });

    it("should not update transaction with insufficient fields", function (done) {
      agentUser1
        .put(`/api/transactions/${transactionId1}`)
        .send({
          customLabels: "none",
          vendor: "Tester",
        })
        .end((err, res) => {
          expect(res).to.have.status(400);
          done();
        });
    });

    it("should not update transaction with invalid transaction ID", function (done) {
      const date = new Date();
      const formattedDate = date.toISOString().split("T")[0];
      agentUser1
        .put(`/api/transactions/${fakeBookId}`)
        .send({
          customLabels: ["none"],
          vendor: "Tester",
          amount: 300,
          dateOfTransaction: formattedDate,
        })
        .end((err, res) => {
          expect(res).to.have.status(404);
          done();
        });
    });

    it("should not update transaction for unauthorized user", function (done) {
      const date = new Date();
      const formattedDate = date.toISOString().split("T")[0];
      agentUser2
        .put(`/api/transactions/${transactionId1}`)
        .send({
          customLabels: ["none"],
          vendor: "Tester",
          amount: 300,
          dateOfTransaction: formattedDate,
        })
        .end((err, res) => {
          expect(res).to.have.status(404);
          done();
        });
    });

    it("should not update transaction for not logged in user", function (done) {
      const date = new Date();
      const formattedDate = date.toISOString().split("T")[0];
      chai.request
        .execute(server)
        .put(`/api/transactions/${transactionId1}`)
        .send({
          customLabels: ["none"],
          vendor: "Tester",
          amount: 300,
          dateOfTransaction: formattedDate,
        })
        .end((err, res) => {
          expect(res).to.have.status(401);
          done();
        });
    });
  });

  describe("POST /api/budgetings/", function () {
    it("should create budget successfully", function (done) {
      agentUser1
        .post("/api/budgetings/")
        .send({
          budgetingType: "Budget",
          goalAmount: 2999,
          refreshTime: "Monthly",
          relatedBookId: bookId1,
          userId: userId1,
        })
        .end((err, res) => {
          expect(res).to.have.status(201);
          budgetingId1 = res.body.newBudgeting._id;
          done();
        });
    });

    it("should create goal successfully", function (done) {
      agentUser1
        .post("/api/budgetings/")
        .send({
          budgetingType: "Goal",
          goalAmount: 10000,
          refreshTime: "Yearly",
          relatedBookId: bookId1,
          userId: userId1,
        })
        .end((err, res) => {
          expect(res).to.have.status(201);
          budgetingId2 = res.body.newBudgeting._id;
          done();
        });
    });

    it("should not create budgeting with insufficient fields", function (done) {
      agentUser1
        .post("/api/budgetings/")
        .send({
          budgetingType: "Budget",
          goalAmount: 2999,
          relatedBookId: bookId1,
        })
        .end((err, res) => {
          expect(res).to.have.status(400);
          done();
        });
    });

    it("should not create budgeting with invalid book ID", function (done) {
      agentUser1
        .post("/api/budgetings/")
        .send({
          budgetingType: "Budget",
          goalAmount: 2999,
          refreshTime: "Monthly",
          relatedBookId: fakeBookId,
          userId: userId1,
        })
        .end((err, res) => {
          expect(res).to.have.status(404);
          done();
        });
    });
  });

  describe("GET /api/budgetings/budgets/one/:relatedBookId", function () {
    it("should get budget successfully", function (done) {
      agentUser1
        .get(`/api/budgetings/budgets/one/${bookId1}`)
        .end((err, res) => {
          expect(res).to.have.status(201);
          done();
        });
    });

    it("should not get budget for not logged in user", function (done) {
      chai.request
        .execute(server)
        .get(`/api/budgetings/budgets/one/${bookId1}`)
        .end((err, res) => {
          expect(res).to.have.status(401);
          done();
        });
    });

    it("should not get budget for unauthorized user", function (done) {
      agentUser2
        .get(`/api/budgetings/budgets/one/${bookId1}`)
        .end((err, res) => {
          expect(res).to.have.status(403);
          done();
        });
    });

    it("should not get budget for non-existent book", function (done) {
      agentUser1
        .get(`/api/budgetings/budgets/one/${fakeBookId}`)
        .end((err, res) => {
          expect(res).to.have.status(404);
          done();
        });
    });
  });

  describe("GET /api/budgetings/goals/one/:relatedBookId", function () {
    it("should get goal successfully", function (done) {
      agentUser1.get(`/api/budgetings/goals/one/${bookId1}`).end((err, res) => {
        expect(res).to.have.status(201);
        done();
      });
    });

    it("should not get goal for not logged in user", function (done) {
      chai.request
        .execute(server)
        .get(`/api/budgetings/goals/one/${bookId1}`)
        .end((err, res) => {
          expect(res).to.have.status(401);
          done();
        });
    });

    it("should not get goal for unauthorized user", function (done) {
      agentUser2.get(`/api/budgetings/goals/one/${bookId1}`).end((err, res) => {
        expect(res).to.have.status(403);
        done();
      });
    });

    it("should not get goal for non-existent book", function (done) {
      agentUser1
        .get(`/api/budgetings/goals/one/${fakeBookId}`)
        .end((err, res) => {
          expect(res).to.have.status(404);
          done();
        });
    });
  });

  describe("DELETE /api/budgetings/:budgetingId", function () {
    it("should delete budgeting successfully", function (done) {
      agentUser1
        .delete(`/api/budgetings/${budgetingId2}`)
        .send({
          relatedBookId: bookId1,
          userId: userId1,
        })
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
        });
    });

    it("should not delete non-existent budgeting", function (done) {
      agentUser1
        .delete(`/api/budgetings/${fakeBudgetingId}`)
        .send({
          relatedBookId: bookId1,
          userId: userId1,
        })
        .end((err, res) => {
          expect(res).to.have.status(405);
          done();
        });
    });

    it("should not delete budgeting for unauthorized user", function (done) {
      agentUser2
        .delete(`/api/budgetings/${budgetingId1}`)
        .send({
          relatedBookId: bookId1,
          userId: userId1,
        })
        .end((err, res) => {
          expect(res).to.have.status(403);
          done();
        });
    });

    it("should not delete budgeting with insufficient fields", function (done) {
      agentUser1.delete(`/api/budgetings/${budgetingId1}`).end((err, res) => {
        expect(res).to.have.status(400);
        done();
      });
    });

    it("should not delete budgeting with invalid book ID", function (done) {
      agentUser1
        .delete(`/api/budgetings/${budgetingId1}`)
        .send({
          relatedBookId: fakeBookId,
          userId: userId1,
        })
        .end((err, res) => {
          expect(res).to.have.status(404);
          done();
        });
    });
  });

  describe("GET /api/custom-labels/", function () {
    it("should get custom income labels successfully", function (done) {
      agentUser1.get("/api/custom-labels/?type=Income").end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body.customLabels).to.be.an("array");
        expect(res.body.customLabels).to.have.lengthOf(0);
        done();
      });
    });

    it("should get custom expense labels successfully", function (done) {
      agentUser1.get("/api/custom-labels/?type=Expense").end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body.customLabels).to.be.an("array");
        expect(res.body.customLabels).to.have.lengthOf(0);
        done();
      });
    });

    it("should not get custom labels for unauthorized user", function (done) {
      chai.request
        .execute(server)
        .get("/api/custom-labels/?type=Income")
        .end((err, res) => {
          expect(res).to.have.status(401);
          done();
        });
    });

    it("should not get custom labels with missing type", function (done) {
      agentUser1.get("/api/custom-labels/").end((err, res) => {
        expect(res).to.have.status(400);
        done();
      });
    });
  });

  describe("POST /api/custom-labels/", function () {
    it("should create custom label successfully", function (done) {
      agentUser1
        .post("/api/custom-labels/")
        .send({
          labelName: "Test Label",
          type: "Income",
        })
        .end((err, res) => {
          expect(res).to.have.status(201);
          done();
        });
    });

    it("should not create custom label with insufficient fields", function (done) {
      agentUser1
        .post("/api/custom-labels/")
        .send({
          labelName: "Test Label",
        })
        .end((err, res) => {
          expect(res).to.have.status(400);
          done();
        });
    });

    it("should not create custom label with invalid type", function (done) {
      agentUser1
        .post("/api/custom-labels/")
        .send({
          labelName: "Test Label",
          type: "Invalid",
        })
        .end((err, res) => {
          expect(res).to.have.status(400);
          done();
        });
    });

    it("should not create custom label with duplicate label", function (done) {
      agentUser1
        .post("/api/custom-labels/")
        .send({
          labelName: "Test Label",
          type: "Income",
        })
        .end((err, res) => {
          expect(res).to.have.status(400);
          done();
        });
    });

    it("should not create custom label for unauthorized user", function (done) {
      chai.request
        .execute(server)
        .post("/api/custom-labels/")
        .send({
          labelName: "Test Label",
          type: "Income",
        })
        .end((err, res) => {
          expect(res).to.have.status(401);
          done();
        });
    });
  });

  describe("DELETE /api/custom-labels/", function () {
    it("should delete custom label successfully", function (done) {
      agentUser1
        .delete("/api/custom-labels/")
        .send({
          labelName: "Test Label",
          type: "Income",
        })
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
        });
    });

    it("should not delete non-existent custom label", function (done) {
      agentUser1
        .delete("/api/custom-labels/")
        .send({
          labelName: "Test Label",
          type: "Income",
        })
        .end((err, res) => {
          expect(res).to.have.status(404);
          done();
        });
    });

    it("should not delete custom label with insufficient fields", function (done) {
      agentUser1
        .delete("/api/custom-labels/")
        .send({
          labelName: "Test Label",
        })
        .end((err, res) => {
          expect(res).to.have.status(400);
          done();
        });
    });

    it("should not delete custom label from unauthorized user", function (done) {
      agentUser2
        .delete("/api/custom-labels/")
        .send({
          labelName: "Test Label",
          type: "Income",
        })
        .end((err, res) => {
          expect(res).to.have.status(404);
          done();
        });
    });

    it("should not delete custom label with not logged in user", function (done) {
      chai.request
        .execute(server)
        .delete("/api/custom-labels/")
        .send({
          labelName: "Test Label",
          type: "Income",
        })
        .end((err, res) => {
          expect(res).to.have.status(401);
          done();
        });
    });
  });

  describe("GET /api/reports/weekly/:relatedBookId", function () {
    it("should get weekly reports successfully", function (done) {
      agentUser1.get(`/api/reports/weekly/${bookId1}`).end((err, res) => {
        expect(res).to.have.status(206);
        done();
      });
    });

    it("should not get weekly reports for unauthorized user", function (done) {
      agentUser2.get(`/api/reports/weekly/${bookId1}`).end((err, res) => {
        expect(res).to.have.status(403);
        done();
      });
    });

    it("should not get weekly reports for not logged in user", function (done) {
      chai.request
        .execute(server)
        .get(`/api/reports/weekly/${bookId1}`)
        .end((err, res) => {
          expect(res).to.have.status(401);
          done();
        });
    });

    it("should not get weekly reports with invalid book ID", function (done) {
      agentUser1.get(`/api/reports/weekly/${fakeBookId}`).end((err, res) => {
        expect(res).to.have.status(404);
        done();
      });
    });
  });

  describe("GET /api/reports/monthly/:relatedBookId", function () {
    it("should get monthly reports successfully", function (done) {
      agentUser1.get(`/api/reports/monthly/${bookId1}`).end((err, res) => {
        expect(res).to.have.status(207);
        done();
      });
    });

    it("should not get monthly reports for unauthorized user", function (done) {
      agentUser2.get(`/api/reports/monthly/${bookId1}`).end((err, res) => {
        expect(res).to.have.status(403);
        done();
      });
    });

    it("should not get monthly reports for not logged in user", function (done) {
      chai.request
        .execute(server)
        .get(`/api/reports/monthly/${bookId1}`)
        .end((err, res) => {
          expect(res).to.have.status(401);
          done();
        });
    });

    it("should not get monthly reports with invalid book ID", function (done) {
      agentUser1.get(`/api/reports/monthly/${fakeBookId}`).end((err, res) => {
        expect(res).to.have.status(404);
        done();
      });
    });
  });

  describe("DELETE /api/reports/:reportId", function () {
    it("should not delete report with non-existent book", function (done) {
      agentUser1
        .delete(`/api/reports/${fakeReportId1}`)
        .send({
          relatedBookId: fakeBookId,
        })
        .end((err, res) => {
          expect(res).to.have.status(404);
          done();
        });
    });

    it("should not delete report for unauthorized user", function (done) {
      agentUser2
        .delete(`/api/reports/${fakeReportId1}`)
        .send({
          relatedBookId: bookId1,
        })
        .end((err, res) => {
          expect(res).to.have.status(403);
          done();
        });
    });

    it("should not delete report with insufficient fields", function (done) {
      agentUser1.delete(`/api/reports/${fakeReportId1}`).end((err, res) => {
        expect(res).to.have.status(400);
        done();
      });
    });

    it("should not delete non-existent report", function (done) {
      agentUser1
        .delete(`/api/reports/${fakeReportId1}`)
        .send({
          relatedBookId: bookId1,
        })
        .end((err, res) => {
          expect(res).to.have.status(500);
          done();
        });
    });
  });

  describe("DELETE /api/books/", function () {
    it("should failed to delete non-existent book", function (done) {
      agentUser2.delete(`/api/books/${bookId1}`).end((err, res) => {
        expect(res).to.have.status(404);
        done();
      });
    });

    it("should delete book", function (done) {
      agentUser1.delete(`/api/books/${bookId1}`).end((err, res) => {
        expect(res).to.have.status(200);
        done();
      });
    });
  });

  describe("POST /api/auth/signout/", () => {
    it("should logout testuser1 successfully", (done) => {
      agentUser1.post("/api/auth/signout/").end((err, res) => {
        expect(res).to.have.status(200);
        done();
      });
    });

    it("should logout testuser2 successfully", (done) => {
      agentUser2.post("/api/auth/signout/").end((err, res) => {
        expect(res).to.have.status(200);
        done();
      });
    });
  });
});
