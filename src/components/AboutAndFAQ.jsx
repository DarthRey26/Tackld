import React, { useEffect } from "react";

const AboutAndFAQ = () => {
  useEffect(() => {
    const reveal = () => {
      const reveals = document.querySelectorAll(".reveal");

      for (let i = 0; i < reveals.length; i++) {
        const windowHeight = window.innerHeight;
        const revealTop = reveals[i].getBoundingClientRect().top;
        const revealPoint = 100;

        // Adjust the condition to trigger earlier if needed
        if (revealTop < windowHeight - revealPoint) {
          reveals[i].classList.add("active");
        } else {
          reveals[i].classList.remove("active");
        }
      }
    };

    window.addEventListener("scroll", reveal);
    reveal(); // call once on load

    return () => window.removeEventListener("scroll", reveal);
  }, []);

  const steps = [
    {
      title: "Submit your job request",
      description: "Let us know your problem!",
    },
    {
      title: "We match you with a contractor",
      description: "We find the best contractor for your needs",
    },
    {
      title: "Problem solved!",
      description: "Our reliable contractors fix your issue",
    },
  ];

  return (
    <>
      {/* Section 1: Driving Your Growth */}
      <section id="first" className="bg-[#f8f8f8] py-40">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-center gap-10">
            <div className="w-full md:w-1/2 h-[50vh] bg-[url('https://img.freepik.com/premium-photo/two-removal-company-workers-unloading-boxes-from-minibus-into-new-home_179755-15530.jpg')] bg-right bg-no-repeat bg-cover" />
            <div className="w-full md:w-1/2">
              <div className="transition-all duration-1000 translate-x-36 opacity-0 reveal active:translate-x-0 active:opacity-100">
                <h2 className=" font-bold text-[47px] leading-[55px] mb-5">
                  LINKING YOU WITH THE BEST CONTRACTORS.
                </h2>
                <p className="text-[#464646] text-[17px]">
                  Connecting you with top-rated contractors for all your project
                  needs, ensuring quality and reliability every time.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-20 mb-4 w-full">
        {/* Title */}
        <div className="text-center mb-24">
          <h2 className="text-5xl font-bold">Our Process</h2>
        </div>
        <div className="w-full px-8 relative">
          {/* Vertical Line */}
          <div className="absolute left-1/2 transform -translate-x-1/2 top-10 bottom-10 z-0">
            <svg
              height="100%"
              width="40"
              className="mx-auto text-gray-300"
              viewBox="0 0 40 600"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M20 0 C30 100, 10 200, 20 300 S30 500, 20 600"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
              />
            </svg>
          </div>

          {/* Timeline items */}
          <div className="space-y-40 relative z-10 w-full">
            {" "}
            {/* Reduced gap here */}
            {steps.map((step, idx) => (
              <div
                key={idx}
                className={`reveal transition-all duration-1000 opacity-0 translate-y-12 active:opacity-100 active:translate-y-0 w-full`}
              >
                <div className="flex items-center justify-between w-full">
                  {idx % 2 === 0 ? (
                    <>
                      <div className="w-1/2 text-right pr-8">
                        <h3 className="text-3xl font-bold">{step.title}</h3>
                        <p className="text-gray-500 mt-1 text-xl">
                          {step.description}
                        </p>
                      </div>
                      <div className="w-8 h-8 bg-[#283579] rounded-full z-10 relative" />
                      <div className="w-1/2" />
                    </>
                  ) : (
                    <>
                      <div className="w-1/2" />
                      <div className="w-8 h-8 bg-[#283579]  rounded-full z-10 relative" />
                      <div className="w-1/2 text-left pl-8">
                        <h3 className="text-3xl font-bold">{step.title}</h3>
                        <p className="text-gray-500 mt-1 text-xl">
                          {step.description}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 2: FAQ */}
      <section className="bg-[#f8f8f8] overflow-hidden">
        <div className="container mx-auto px-20 py-20">
          <div className="flex flex-col lg:flex-row gap-12">
            <div className="lg:w-1/3 space-y-4">
              <h3 className="reveal transition-all duration-1000 translate-y-12 opacity-0 text-3xl font-normal mb-4 active:translate-y-0 active:opacity-100">
                Frequently Asked <strong>Questions</strong>
              </h3>
              <p className="reveal transition-all duration-1000 delay-200 translate-y-12 opacity-0 text-sm text-gray-600 active:translate-y-0 active:opacity-100">
                Commonly asked questions about our services, pricing, and
                procedures.
              </p>
            </div>
            <div className="lg:w-2/3 space-y-4">
              {faqItems.map((item, idx) => (
                <details
                  key={idx}
                  className="reveal transition-all duration-1000 translate-y-12 opacity-0 bg-white border border-gray-200 rounded-lg shadow active:translate-y-0 active:opacity-100"
                >
                  <summary className="cursor-pointer p-5 font-semibold text-left text-lg">
                    <span className="mr-2">{idx + 1}.</span> {item.question}
                  </summary>
                  <div className="p-5 space-y-2 text-sm text-gray-700">
                    {item.answer.map((text, tidx) => (
                      <p key={tidx}>{text}</p>
                    ))}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

const faqItems = [
  {
    question: "Cards, EasiCredit and ATM withdrawal activation?",
    answer: [
      "Please send the SMS request from the mobile number you registered with us. Send the request to 72323 (local) or +65 9327 2323 (overseas)",
    ],
  },
  {
    question: "OCBC Bank and Branch code",
    answer: [
      "Bank code: 7339",
      "The first three numbers of your OCBC account number are branch codes. Your OCBC Account Number should either be 10 or 12 digits.",
      "Examples of OCBC Bank account numbers:\n555-1-234567 where 555 is the branch code\n501-123956-001 where 501 is the branch code",
    ],
  },
  {
    question:
      "How long will it take for changes to personal contact details via Internet Banking/OCBC Digital app to be effective?",
    answer: [
      "For update of mailing address, changes made to current and savings accounts and OCBC credit cards will take effect immediately. For other accounts and products, it will take 7 working days.",
      "For update of contact details and email, it will take at least 12 hours for the changes to be effective.",
    ],
  },
  {
    question: "How do I retrieve my access code",
    answer: [
      "Your access code will be given to you when you sign up for Online Banking. It is needed, together with your PIN, to login. If you're not sure what your access code is, contact us at 1800 363 3333 or +65 6363 3333.",
    ],
  },
  {
    question: "How do I use the online remote account opening capability?",
    answer: [
      'To open an account online, select the account you wish to apply for and click on the "Apply online" button application. This is accessible via a desktop web browser or a mobile browser.',
      "To enable a simpler, faster and instant account opening, we have integrated MyInfo to pull your personal data from the MyInfo database to fill out the online application upon your consent.",
    ],
  },
];

export default AboutAndFAQ;
