// ── STATE ──
let allRows = [];
let sortCol = -1;
let sortDir = 1;

let fnf_state    = "both";
let year_state   = "all_years";
let rating_state = "all_ratings";
let search_state = "";

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

        if (j === 3)      td.className = val === "Fiction" ? "f_td" : "nf_td";
        else if (j === 4) td.className = val + "_yr_td";
        else if (j === 0) td.className = "title_td";
        else if (j === 1) td.className = "author_td";
        else if (j === 2) td.className = "pub_td";
        else if (j === 5) td.className = "rating_td";

        row.appendChild(td);
      }

      table.appendChild(row);
      allRows.push(row);
    }

    update_stats();
    update_row_count();
  });


// ── SORTING ──
document.querySelectorAll("thead th[data-col]").forEach(th => {
  th.addEventListener("click", function () {
    const col = parseInt(this.dataset.col);
    if (sortCol === col) { sortDir *= -1; } else { sortCol = col; sortDir = 1; }

    document.querySelectorAll("thead th[data-col]").forEach(h => h.classList.remove("sort-asc", "sort-desc"));
    this.classList.add(sortDir === 1 ? "sort-asc" : "sort-desc");

    const tbody = document.getElementById("b_data");
    const rows = Array.from(tbody.querySelectorAll("tr"));

    rows.sort((a, b) => {
      const aCells = a.querySelectorAll("td");
      const bCells = b.querySelectorAll("td");
      if (!aCells[col] || !bCells[col]) return 0;
      let aVal = aCells[col].textContent.trim();
      let bVal = bCells[col].textContent.trim();
      if (col === 2 || col === 4 || col === 5) return (parseFloat(aVal) - parseFloat(bVal)) * sortDir;
      return aVal.localeCompare(bVal) * sortDir;
    });

    rows.forEach(row => tbody.appendChild(row));
  });
});


// ── FILTER LISTENERS ──
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

document.getElementById("search_box").addEventListener("input", function (e) {
  search_state = e.target.value.toLowerCase().trim();
  const rows = document.querySelectorAll("#b_data tr");

  rows.forEach(row => {
    if (search_state === "") {
      row.classList.remove("search_hidden");
    } else {
      const title  = row.querySelector(".title_td")  ? row.querySelector(".title_td").textContent.toLowerCase()  : "";
      const author = row.querySelector(".author_td") ? row.querySelector(".author_td").textContent.toLowerCase() : "";
      const pub    = row.querySelector(".pub_td")    ? row.querySelector(".pub_td").textContent.toLowerCase()    : "";
      if (title.includes(search_state) || author.includes(search_state) || pub.includes(search_state)) {
        row.classList.remove("search_hidden");
      } else {
        row.classList.add("search_hidden");
      }
    }
  });

  update_stats();
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

  update_stats();
  update_row_count();
}


// ── STATS ──
function get_visible_rows() {
  return Array.from(document.querySelectorAll("#b_data tr")).filter(row =>
    !row.classList.contains("filter_hidden") && !row.classList.contains("search_hidden")
  );
}

function update_stats() {
  const visible = get_visible_rows();
  if (visible.length === 0) {
    document.getElementById("stats-row").style.display = "none";
    return;
  }
  document.getElementById("stats-row").style.display = "";

  // Total books
  document.getElementById("stat-total").textContent = visible.length;

  // Average rating
  const ratings = visible
    .map(row => {
      const td = row.querySelector(".rating_td");
      return td ? parseFloat(td.textContent.trim()) : null;
    })
    .filter(r => r !== null && !isNaN(r));
  const avg = ratings.length ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(2) : "—";
  document.getElementById("stat-avg-rating").textContent = avg;

  // Fiction/NF split — only show when fnf filter is "both"
  const splitStat = document.getElementById("stat-split-wrap");
  if (fnf_state === "both") {
    splitStat.style.display = "";
    const fiction = visible.filter(row => row.querySelector(".f_td")).length;
    const nf      = visible.filter(row => row.querySelector(".nf_td")).length;
    const total   = fiction + nf;
    const fPct    = total ? Math.round((fiction / total) * 100) : 0;
    const nfPct   = 100 - fPct;
    document.getElementById("stat-split").textContent = fPct + "% fiction, " + nfPct + "% non-fiction";
  } else {
    splitStat.style.display = "none";
  }

  // Books per year — only show when year filter is "all_years"
  const bpyStat = document.getElementById("stat-bpy-wrap");
  if (year_state === "all_years") {
    bpyStat.style.display = "";
    // Count distinct years in visible rows
    const yearCounts = {};
    visible.forEach(row => {
      const td = row.querySelector("[class$='_yr_td']");
      if (td) {
        const y = td.textContent.trim();
        yearCounts[y] = (yearCounts[y] || 0) + 1;
      }
    });
    const years = Object.keys(yearCounts).length;
    const bpy = years ? (visible.length / years).toFixed(1) : "—";
    document.getElementById("stat-bpy").textContent = bpy;
    document.getElementById("stat-bpy-label").textContent = "books / year";
  } else {
    // Show books in that specific year instead
    bpyStat.style.display = "";
    document.getElementById("stat-bpy").textContent = visible.length;
    document.getElementById("stat-bpy-label").textContent = "books in " + year_state;
  }
}


// ── ROW COUNT ──
function update_row_count() {
  const total   = document.querySelectorAll("#b_data tr").length;
  const visible = get_visible_rows().length;
  const el      = document.getElementById("visible_count");
  if (el) {
    el.textContent = visible === total ? total + " books" : visible + " of " + total + " books";
  }
}
