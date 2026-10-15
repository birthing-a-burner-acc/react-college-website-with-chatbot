import "./Location.css";

const location =
  "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d13178.206437805513!2d78.37399762581556!3d17.44204244162253!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bcb91570b31e157%3A0x81bb1afc220e0b9e!2siLabs%20Capital!5e0!3m2!1sen!2sin!4v1791976698397!5m2!1sen!2sin";

const Location = () => {
  return (
    <section className="location">
      <iframe
        src={location}
        width="600"
        height="450"
        style={{ border: 0 }}
        allowFullScreen=""
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      ></iframe>
    </section>
  );
};

export default Location;
