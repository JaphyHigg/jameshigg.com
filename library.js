// ── STATE ──
let allRows = [];
let sortCol = -1;
let sortDir = 1; // 1 = asc, -1 = desc

let fnf_state    = "both";
let year_state   = "all_years";
let rating_state = "all_ratings";

// ── LOAD CSV ──
fetch("books.csv")
  .then(response => response.text())
  .then(data => {
    const results = Papa.parse(data, { skipEmptyLines: true });
    const table = document.getElementById("b_data");

    for (let i = 1; i < results.data.length; i++) {
      const row = document.createElement("tr");
      const rowData = results.data[i];

      for (let j = 0; j < 6; j++) {
        const td = document.createElement("td");
        const val = rowData[j] ? rowData[j].trim() : "";
        td.textContent = val;

        if (j === 3) {
          td.className = val === "Fiction" ? "f_td" : "nf_td";
        } else if (j === 4) {
          td.className = val + "_yr_td";
        } else if (j === 0) {
          td.className = "title_td";
        } else if (j === 1) {
          td.className = "author_td";
        } else if (j === 2) {
          td.className = "pub_td";
        } else if (j === 5) {
          td.className = "rating_td";
        }

        row.appendChild(td);
      }

      table.appendChild(row);
      allRows.push(row);
    }

    // Set total book count
    const countEl = document.getElementById("book_count");
    if (countEl) countEl.textContent = allRows.length;

    update_row_count();
  });


// ── SORTING ──
document.querySelectorAll("thead th[data-col]").forEach(th => {
  th.addEventListener("click", function () {
    const col = parseInt(this.dataset.col);

    // Toggle direction if same column, else reset to asc
    if (sortCol === col) {
      sortDir *= -1;
    } else {
      sortCol = col;
      sortDir = 1;
    }

    // Update header indicators
    document.querySelectorAll("thead th[data-col]").forEach(h => {
      h.classList.remove("sort-asc", "sort-desc");
    });
    this.classList.add(sortDir === 1 ? "sort-asc" : "sort-desc");

    const tbody = document.getElementById("b_data");
    const rows = Array.from(tbody.querySelectorAll("tr"));

    rows.sort((a, b) => {
      const aCells = a.querySelectorAll("td");
      const bCells = b.querySelectorAll("td");
      if (!aCells[col] || !bCells[col]) return 0;

      let aVal = aCells[col].textContent.trim();
      let bVal = bCells[col].textContent.trim();

      // Numeric sort for rating, published, year read
      if (col === 2 || col === 4 || col === 5) {
        return (parseFloat(aVal) - parseFloat(bVal)) * sortDir;
      }

      return aVal.localeCompare(bVal) * sortDir;
    });

    rows.forEach(row => tbody.appendChild(row));
  });
});


// ── FILTER STATE ──
document.getElementById("fnf").addEventListener("change", function () {
  fnf_state = this.value;
  apply_filters();
});

document.getElementById("read_filter").addEventListener("change", function () {
  year_state = this.value;
  apply_filters();
});

document.getElementById("rating_filter").addEventListener("change", function () {
  rating_state = this.value;
  apply_filters();
});

// ── SEARCH ──
document.getElementById("search_box").addEventListener("input", function (e) {
  const query = e.target.value.toLowerCase().trim();
  const rows = document.querySelectorAll("#b_data tr");

  rows.forEach(row => {
    if (query === "") {
      row.classList.remove("search_hidden");
    } else {
      const title  = row.querySelector(".title_td")  ? row.querySelector(".title_td").textContent.toLowerCase()  : "";
      const author = row.querySelector(".author_td") ? row.querySelector(".author_td").textContent.toLowerCase() : "";
      const pub    = row.querySelector(".pub_td")    ? row.querySelector(".pub_td").textContent.toLowerCase()    : "";

      if (title.includes(query) || author.includes(query) || pub.includes(query)) {
        row.classList.remove("search_hidden");
      } else {
        row.classList.add("search_hidden");
      }
    }
  });

  update_row_count();
});


// ── APPLY FILTERS ──
function apply_filters() {
  const rows = document.querySelectorAll("#b_data tr");

  rows.forEach(row => {
    const fnf_td    = row.querySelector(".f_td, .nf_td");
    const year_td   = row.querySelector("[class$='_yr_td']");
    const rating_td = row.querySelector(".rating_td");

    const fnf_val    = fnf_td    ? fnf_td.textContent.trim()    : "";
    const year_val   = year_td   ? year_td.textContent.trim()   : "";
    const rating_val = rating_td ? parseFloat(rating_td.textContent.trim()) : null;

    let fnf_hide = false;
    if (fnf_state === "f"  && fnf_val !== "Fiction")     fnf_hide = true;
    if (fnf_state === "nf" && fnf_val !== "Non-Fiction") fnf_hide = true;

    let year_hide = false;
    if (year_state !== "all_years" && year_val !== year_state) year_hide = true;

    let rating_hide = false;
    if (rating_state !== "all_ratings" && rating_val !== null) {
      const ranges = {
        "5":  r => r === 5,
        "4s": r => r >= 4 && r < 5,
        "3s": r => r >= 3 && r < 4,
        "2s": r => r >= 2 && r < 3,
        "1s": r => r >= 1 && r < 2,
      };
      if (ranges[rating_state] && !ranges[rating_state](rating_val)) rating_hide = true;
    }

    if (fnf_hide || year_hide || rating_hide) {
      row.classList.add("filter_hidden");
    } else {
      row.classList.remove("filter_hidden");
    }
  });

  update_row_count();
}


// ── ROW COUNT ──
function update_row_count() {
  const total = document.querySelectorAll("#b_data tr").length;
  const visible = document.querySelectorAll("#b_data tr:not(.filter_hidden):not(.search_hidden)").length;
  const countEl = document.getElementById("visible_count");
  if (countEl) {
    if (visible === total) {
      countEl.textContent = total + " books";
    } else {
      countEl.textContent = visible + " of " + total + " books";
    }
  }
}
