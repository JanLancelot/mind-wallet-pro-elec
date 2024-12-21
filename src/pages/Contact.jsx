import React from "react";
import cha from "../assets/cha.webp";
import hyunjin from "../assets/hyunjin.webp";
import jungkok from "../assets/jungkok.webp";

import Navbar from "../components/Navbar";

const developers = [
  {
    name: "Kim Ryan Nabo",
    image: hyunjin,
    role: "Frontend Developer, Papers",
    contact: "norman@gmail.com",
  },
  {
    name: "Jan Lancelot P. Mailig",
    image: cha,
    role: "Group Leader, Frontend & Backend Developer, Papers",
    contact: "lancelot@gmail.com",
  },
  {
    name: "Norman De Leon",
    image: jungkok,
    role: "Frontend Developer, Papers",
    contact: "norman@gmail.com",
  },
];

export default function Contact() {
  return (
    <div>
      <Navbar />
      <div className="container mx-auto py-10 px-4">
        <h1 className="text-3xl font-bold mb-6 text-center">
          Meet the Developers
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {developers.map((dev, index) => (
            <div
              key={index}
              className="bg-gray-100 rounded-md p-4 shadow-sm flex flex-col items-center"
            >
              <img
                src={dev.image}
                alt={dev.name}
                className="rounded-full w-32 h-32 object-cover mb-4"
              />
              <h2 className="text-xl font-semibold mb-2 text-center">
                {dev.name}
              </h2>
              <p className="text-gray-700 text-center mb-2">{dev.role}</p>
              <p className="text-blue-600 text-center hover:underline">
                <a href={`mailto:${dev.contact}`}>{dev.contact}</a>
              </p>
            </div>
          ))}
        </div>
        <div className="mt-8">
          <p className="text-gray-700 leading-relaxed text-center">
            For any other inquiries, please contact us at
            <a
              href="mailto:contact@budgee.com"
              className="text-blue-600 hover:underline"
            >
              contact@budgee.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
