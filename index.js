const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const app = express();
const mongoUri = process.env.MONGODB_URI || "mongodb+srv://saifullah22044:Test123@cluster0.svl6zpm.mongodb.net/todolist";
mongoose.connect(mongoUri);

const listSchema = new mongoose.Schema({ name: String });
const itemSchema = new mongoose.Schema({
  name: String,
  items: [listSchema]
});

const List = mongoose.model("List", listSchema);
const Item = mongoose.model("Item", itemSchema);

const item1 = new List({ name: "hi" });
const item2 = new List({ name: "hello" });
const item3 = new List({ name: "by" });
const defaultItems = [item1, item2, item3];

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public")); // Ensure this line is present
app.set('view engine', 'ejs');

// Middleware to ignore favicon requests
app.get('/favicon.ico', (req, res) => res.status(204).end());

app.get('/', function (req, res) {
  List.find({})
    .then(foundItems => {
      if (foundItems.length === 0) {
        List.insertMany(defaultItems)
          .then(() => {
            res.redirect("/");
          })
          .catch(err => console.error(err));
      } else {
        res.render("list", { KindOfday: "Today", Addnews: foundItems, buttonTitle: "Today" });
      }
    })
    .catch(err => {
      console.error(err);
    });
});

app.post('/', function (req, res) {
  const itemName = req.body.newItem;
  const ButtonName = req.body.button;
  const item = new List({ name: itemName });

  if (ButtonName === "Today") {
    item.save()
      .then(() => res.redirect("/"))
      .catch(err => console.error(err));
  } else {
    Item.findOne({ name: ButtonName })
      .then(foundlist => {
        if (foundlist) {
          foundlist.items.push(item);
          return foundlist.save();
        } else {
          const newList = new Item({
            name: ButtonName,
            items: [item]
          });
          return newList.save();
        }
      })
      .then(() => res.redirect("/" + ButtonName))
      .catch(err => console.error(err));
  }
});

app.get("/:customListName", function (req, res) {
  const customListName = req.params.customListName;
  Item.findOne({ name: customListName })
    .then(foundlist => {
      if (!foundlist) {
        const list = new Item({ name: customListName, items: defaultItems });
        list.save()
          .then(() => res.redirect("/" + customListName))
          .catch(err => console.error(err));
      } else {
        res.render("list", { KindOfday: foundlist.name, Addnews: foundlist.items, buttonTitle: customListName });
      }
    })
    .catch(err => {
      console.error(err);
    });
});

app.get("/food", function (req, res) {
  res.render("list", { KindOfday: "Food List", Addnews: [], buttonTitle: "Food" });
});

app.post('/food', function (req, res) {
  const item = req.body.newItem;
  res.redirect("/food");
});

app.post('/delete', function (req, res) {
  const checkedItemId = req.body.checkboxes;
  const listName = req.body.listname;

  if (listName === "Today") {
    List.findByIdAndDelete(checkedItemId)
      .then(() => {
        console.log("Successfully deleted checked item.");
        res.redirect("/");
      })
      .catch(err => {
        console.error(err);
      });
  } else {
    Item.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedItemId } } }
    )
      .then(() => {
        console.log("Successfully deleted checked item.");
        res.redirect("/" + listName);
      })
      .catch(err => {
        console.error(err);
      });
  }
});
const port = process.env.PORT || 3000;
app.listen(port, function () {
  console.log("Server has started on port " + port);
});