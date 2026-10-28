
import { useState } from "react";
import "./App.css";

const API_URL = "http://127.0.0.1:5000/api";

// Load all local images from src/assets
const images = import.meta.glob(
  "./assets/*.{jpg,jpeg,png,webp,jfif}",
  {
    eager: true,
    query: "?url",
    import: "default",
  }
);

// Find an image by its filename
function getAssetImage(imageName) {
  if (!imageName) return "";

  const fileName = imageName
    .split("/")
    .pop()
    .replace(/\.[^/.]+$/, "")
    .toLowerCase();

  const matchedKey = Object.keys(images).find((path) => {
    const currentName = path
      .split("/")
      .pop()
      .replace(/\.[^/.]+$/, "")
      .toLowerCase();

    return currentName === fileName;
  });

  return matchedKey ? images[matchedKey] : "";
}

// Map database PG image names to local main photos
function getImage(imageName) {
  if (!imageName) return "";

  const fileName = imageName
    .split("/")
    .pop()
    .replace(/\.[^/.]+$/, "")
    .toLowerCase();

  const directImage = getAssetImage(fileName);

  if (directImage) return directImage;

  const imageMap = {
    pg1: "m01",
    pg2: "m02",
    pg3: "m03",
    pg4: "m04",
    pg5: "m05",
    pg6: "m06",
    pg7: "m07",
    pg8: "m08",
    pg9: "m09",
    pg10: "m10",
    pg11: "m11",
    pg12: "m12",
    pg13: "m13",
    pg14: "m14",
    pg15: "m15",
    pg16: "m16",
    pg17: "m17",
    pg18: "m18",
    pg19: "m19",
    pg20: "m20",
    pg21: "m21",
    pg22: "m22",
    pg23: "m23",
    pg24: "m24",
    pg25: "m25",
  };

  return getAssetImage(imageMap[fileName] || "");
}

// Room photos
const roomImages = {
  Single: ["s01.jpg", "s02.jpg", "s03.jpg"],
  Double: ["tw01.jpg", "tw02.jpg", "tw03.jpg"],
  Triple: ["t01.jpg", "t02.jpg", "t03.jpg"],
  Four: ["f01.jpg", "f02.jpg", "f03.jpg"],
};

function App() {
  const [area, setArea] = useState("Velachery");
  const [gender, setGender] = useState("Men");
  const [pgs, setPgs] = useState([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [selectedPG, setSelectedPG] = useState(null);
  const [sharing, setSharing] = useState("Double");

  const [visitor, setVisitor] = useState({
    name: "",
    age: "",
    phone: "",
    email: "",
  });

  // Search PGs from Flask and MySQL
  async function searchPGs(event) {
    if (event) event.preventDefault();

    setLoading(true);
    setError("");
    setSearched(true);
    setSelectedPG(null);

    try {
      const url =
        `${API_URL}/pgs?area=${encodeURIComponent(area.trim())}` +
        `&gender=${encodeURIComponent(gender)}`;

      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to load PGs");
      }

      const results = Array.isArray(data)
        ? data
        : Array.isArray(data.pgs)
          ? data.pgs
          : [];

      setPgs(results);
    } catch (err) {
      console.error("PG search error:", err);
      setPgs([]);
      setError(
        `Could not load PGs: ${err.message}. Check that Flask is running on port 5000.`
      );
    } finally {
      setLoading(false);
    }
  }

  // Open PG details
  function openDetails(pg) {
    setSelectedPG(pg);
    setSharing(pg.room_type || "Double");

    setVisitor({
      name: "",
      age: "",
      phone: "",
      email: "",
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Demo sharing prices
  // Replace with actual sharing prices when available in MySQL.
  function getRent(pg, type) {
    const baseRent = Number(pg.rent) || 0;

    if (type === (pg.room_type || "Double")) {
      return baseRent;
    }

    const extraRent = {
      Single: 6000,
      Double: 3000,
      Triple: 1500,
      Four: 0,
    };

    return extraRent[type] ?? baseRent;
  }

  function updateVisitor(event) {
    const { name, value } = event.target;

    setVisitor((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  // Submit visitor enquiry to Flask
  async function submitVisitor(event) {
    event.preventDefault();

    if (!selectedPG) return;

    try {
      const response = await fetch(`${API_URL}/visitors`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...visitor,
          age: Number(visitor.age),
          area: selectedPG.area,
          gender: selectedPG.gender,
          pg_id: selectedPG.id,
          pg_name: selectedPG.name,
          sharing_type: sharing,
          rent: getRent(selectedPG, sharing),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to save enquiry");
      }

      alert("Your enquiry has been submitted successfully!");

      setVisitor({
        name: "",
        age: "",
        phone: "",
        email: "",
      });
    } catch (err) {
      console.error("Visitor submission error:", err);
      alert(`Could not submit enquiry: ${err.message}`);
    }
  }

  const sharingOptions = ["Single", "Double", "Triple", "Four"];

  // Images for the currently selected sharing type
  const selectedRoomImages = roomImages[sharing] || [];

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <a
          className="logo"
          href="#home"
          onClick={() => setSelectedPG(null)}
        >
          StayFinder
        </a>

        <nav>
          <a href="#home">Home</a>
          <a href="#search">Find PG</a>
          <a href="#listings">PG Listings</a>
        </nav>
      </header>

      {/* Hero */}
      <section className="hero" id="home">
        <div className="hero-content">
          <p className="hero-label">YOUR COMFORT, YOUR SPACE</p>

          <h1>Find Your Perfect PG Stay</h1>

          <p>
            Find a comfortable place to stay with facilities that suit
            your needs and budget.
          </p>

          <a className="btn btn-primary" href="#search">
            Explore PGs
          </a>
        </div>
      </section>

      <main>
        {/* Search */}
        <section className="search-section" id="search">
          <h2>Find a PG Near You</h2>

          <p>Choose your preferred area and accommodation.</p>

          <form className="search-form" onSubmit={searchPGs}>
            <div className="form-group">
              <label htmlFor="area">Select Area</label>

              <select
                id="area"
                value={area}
                onChange={(event) => setArea(event.target.value)}
              >
                <option value="Tambaram">Tambaram</option>
                <option value="Velachery">Velachery</option>
                <option value="T Nagar">T Nagar</option>
                <option value="Guindy">Guindy</option>
                <option value="Sholinganallur">Sholinganallur</option>
                <option value="Perungudi">Perungudi</option>
                <option value="Adyar">Adyar</option>
                <option value="Porur">Porur</option>
                <option value="Anna Nagar">Anna Nagar</option>
                <option value="Chromepet">Chromepet</option>
              </select>
            </div>

            <div className="form-group">
              <label>Accommodation For</label>

              <div className="gender-options">
                <button
                  type="button"
                  className={`gender-btn ${
                    gender === "Men" ? "active" : ""
                  }`}
                  onClick={() => setGender("Men")}
                >
                  Men
                </button>

                <button
                  type="button"
                  className={`gender-btn ${
                    gender === "Women" ? "active" : ""
                  }`}
                  onClick={() => setGender("Women")}
                >
                  Women
                </button>
              </div>
            </div>

            <button
              className="btn btn-primary"
              type="submit"
              disabled={loading}
            >
              {loading ? "Searching..." : "Search PG"}
            </button>
          </form>
        </section>

        {error && (
          <div className="error-state">
            <p>{error}</p>

            <button className="btn btn-primary" onClick={searchPGs}>
              Try Again
            </button>
          </div>
        )}

        {/* PG details */}
        {selectedPG && (
          <section className="section details-section">
            <button
              className="btn btn-secondary"
              onClick={() => setSelectedPG(null)}
            >
              ← Back to Listings
            </button>

            <div className="details-layout">
              <div className="details-main">
                {/* Main PG photo */}
                {getImage(selectedPG.image) ? (
                  <img
                    className="details-main-image"
                    src={getImage(selectedPG.image)}
                    alt={selectedPG.name}
                  />
                ) : (
                  <div className="image-placeholder">
                    PG photo not available
                  </div>
                )}

                <h2>{selectedPG.name}</h2>

                <p className="pg-location">
                  📍 {selectedPG.area}
                </p>

                <p>
                  {selectedPG.description ||
                    "Comfortable accommodation with useful facilities."}
                </p>

                <h3>Accommodation For</h3>
                <p>{selectedPG.gender} PG</p>

                <h3>Facilities</h3>
                <p>
                  {selectedPG.facilities || "Facilities not specified"}
                </p>

                {/* Sharing selection */}
                <h3>Choose Room Sharing</h3>

                <div className="room-options">
                  {sharingOptions.map((option) => (
                    <button
                      key={option}
                      type="button"
                      className={`room-option ${
                        sharing === option ? "active" : ""
                      }`}
                      onClick={() => setSharing(option)}
                    >
                      <span>
                        {option === "Four"
                          ? "4 Sharing"
                          : option === "Triple"
                            ? "3 Sharing"
                            : option === "Double"
                              ? "2 Sharing"
                              : "Single Sharing"}
                      </span>

                      <strong>
                        ₹{getRent(selectedPG, option).toLocaleString("en-IN")}
                      </strong>
                    </button>
                  ))}
                </div>

                {/* Sharing room photos */}
                <h3>
                  {sharing === "Four"
                    ? "Four Sharing Room Photos"
                    : `${sharing} Sharing Room Photos`}
                </h3>

                <div className="pg-grid">
                  {selectedRoomImages.map((imageName) => {
                    const imageUrl = getAssetImage(imageName);

                    return (
                      <article className="pg-card" key={imageName}>
                        {imageUrl ? (
                          <img
                            className="pg-image"
                            src={imageUrl}
                            alt={`${sharing} sharing room`}
                          />
                        ) : (
                          <div className="image-placeholder">
                            {imageName} not found
                          </div>
                        )}

                        <div className="pg-card-content">
                          <p>{sharing} Sharing Room</p>
                        </div>
                      </article>
                    );
                  })}
                </div>

                {/* Bathroom photo */}
                <h3>Bathroom</h3>

                <div className="details-gallery">
                  {getAssetImage("b01.jpg") ? (
                    <img
                      className="details-main-image"
                      src={getAssetImage("b01.jpg")}
                      alt="PG bathroom"
                    />
                  ) : (
                    <div className="image-placeholder">
                      Bathroom photo b01.jpg not found
                    </div>
                  )}
                </div>

                {/* Dining photo */}
                <h3>Dining Area</h3>

                <div className="details-gallery">
                  {getAssetImage("d01.jpg") ? (
                    <img
                      className="details-main-image"
                      src={getAssetImage("d01.jpg")}
                      alt="PG dining area"
                    />
                  ) : (
                    <div className="image-placeholder">
                      Dining photo d01.jpg not found
                    </div>
                  )}
                </div>
              </div>

              {/* Enquiry form */}
              <aside className="visitor-form">
                <h3>Enquire About This PG</h3>

                <p>
                  Enter your details and we will record your enquiry.
                </p>

                <form onSubmit={submitVisitor}>
                  <div className="form-group">
                    <label htmlFor="visitor-name">Full Name</label>

                    <input
                      id="visitor-name"
                      name="name"
                      value={visitor.name}
                      onChange={updateVisitor}
                      placeholder="Enter your name"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="visitor-age">Age</label>

                    <input
                      id="visitor-age"
                      name="age"
                      type="number"
                      min="18"
                      max="100"
                      value={visitor.age}
                      onChange={updateVisitor}
                      placeholder="Enter your age"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="visitor-phone">Phone Number</label>

                    <input
                      id="visitor-phone"
                      name="phone"
                      type="tel"
                      value={visitor.phone}
                      onChange={updateVisitor}
                      placeholder="Enter your phone number"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="visitor-email">
                      Email (Optional)
                    </label>

                    <input
                      id="visitor-email"
                      name="email"
                      type="email"
                      value={visitor.email}
                      onChange={updateVisitor}
                      placeholder="Enter your email"
                    />
                  </div>

                  <p>
                    Selected: <strong>{sharing} Sharing</strong>
                  </p>

                  <p>
                    Rent:{" "}
                    <strong>
                      ₹{getRent(selectedPG, sharing).toLocaleString("en-IN")}
                    </strong>{" "}
                    / month
                  </p>

                  <button className="btn btn-primary" type="submit">
                    Submit Enquiry
                  </button>
                </form>
              </aside>
            </div>
          </section>
        )}

        {/* Listings */}
        <section className="section" id="listings">
          <div className="section-heading">
            <div>
              <h2>
                {gender} PGs in {area}
              </h2>

              <p>
                {loading
                  ? "Loading PG listings..."
                  : `${pgs.length} PG listing(s) found`}
              </p>
            </div>
          </div>

          {loading && (
            <p className="loading-state">Finding PGs...</p>
          )}

          {!loading && searched && !error && pgs.length === 0 && (
            <div className="empty-state">
              <h3>No PGs found</h3>

              <p>
                No listings match your selection. Try another area or
                accommodation option.
              </p>
            </div>
          )}

          {!loading && !searched && (
            <div className="empty-state">
              <h3>Ready to find your PG?</h3>

              <p>
                Select an area and click Search PG to view available places.
              </p>
            </div>
          )}

          <div className="pg-grid">
            {pgs.map((pg) => {
              const imageUrl = getImage(pg.image);

              return (
                <article className="pg-card" key={pg.id}>
                  {imageUrl ? (
                    <img
                      className="pg-image"
                      src={imageUrl}
                      alt={pg.name}
                    />
                  ) : (
                    <div className="image-placeholder">
                      PG photo not available
                    </div>
                  )}

                  <div className="pg-card-content">
                    <span className="gender-badge">
                      {pg.gender} PG
                    </span>

                    <h3>{pg.name}</h3>

                    <p className="pg-location">
                      📍 {pg.area}
                    </p>

                    <p className="pg-facilities">
                      {pg.facilities || "Facilities not specified"}
                    </p>

                    <div className="pg-rent">
                      <strong>
                        ₹{Number(pg.rent).toLocaleString("en-IN")}
                      </strong>

                      <span>/ month</span>
                    </div>

                    <p>Room type: {pg.room_type || "Double"}</p>

                    <button
                      className="btn btn-primary"
                      onClick={() => openDetails(pg)}
                    >
                      View Details
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="footer">
        <h3>StayFinder</h3>

        <p>Find a place that feels like home.</p>

        <p>© {new Date().getFullYear()} StayFinder</p>
      </footer>
    </div>
  );
}

export default App;