import React, { useState, useEffect } from "react";
import heartIcon from "../../assets/svg/heart.svg";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { GoHeart } from "react-icons/go";
import { useCountryData } from "@/context/CountryDataContext";

// Custom CarouselIndicators component
const CarouselIndicators = ({ currentIndex, total, onClick }) => {
  return (
    <div className="flex absolute bottom-2 left-1/2 transform -translate-x-1/2 justify-center mt-2">
      {Array.from({ length: total }).map((_, index) => (
        <button
          key={index}
          className={`w-2 h-2 shadow rounded-full mx-1 ${currentIndex === index ? "bg-black" : "bg-gray-300"}`}
          onClick={() => onClick(index)}
        />
      ))}
    </div>
  );
};

export default function CountriesDashCard({
  id,
  onClick,
  images,
  location,
  countryFlag,
  sm = true,
  isLiked,
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [loading, setLoading] = useState(false);
  const { addCountryToFavourite } = useCountryData();
  const [currentIndex, setCurrentIndex] = useState(0); // State to track current index
  const [api, setApi] = useState();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!api) {
      return;
    }

    setCount(api.scrollSnapList().length);
    setCurrentIndex(api.selectedScrollSnap());

    api.on("select", () => {
      setCurrentIndex(api.selectedScrollSnap());
    });
  }, [api]);

  const onAddToFavourite = async () => {
    setLoading(true);
    try {
      const res = await addCountryToFavourite(id);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const countryImages = images;

  return (
    <div
      className={`flex flex-col items-start space-y-3 relative ${sm ? "w-full" : "w-[380px]"
        }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <button className="p-2 shadow flex items-center gap-2 text-black bg-white rounded-3xl hover:bg-black hover:text-white text-sm font-semibold absolute top-7 right-4 z-10">
        {loading ? (
          <div className="w-4 h-4 border-2 border-black hover:border-white border-t-transparent rounded-full animate-spin"></div>
        ) : (
          <>
            {isLiked ? (
              <img
                src={heartIcon}
                alt="Liked"
                className="w-5 h-5"
                style={{ width: "1.3rem", height: "1.3rem" }}
              />
            ) : (
              <GoHeart
                onClick={onAddToFavourite}
                style={{ width: "1.3rem", height: "1.3rem" }}
              />
            )}
          </>
        )}
      </button>

      <Carousel
        opts={{
          loop: true,
        }}
        setApi={setApi}
        className={`w-full relative rounded-2xl `}
      >
        <CarouselContent className="rounded-2xl">
          {countryImages.map((item, i) => {
            return (
              <CarouselItem key={i} className="rounded-2xl">
                <img
                  src={item}
                  onClick={onClick}
                  alt="Main Image"
                  className={`w-full cursor-pointer ${sm ? "h-[320px]" : "h-[500px]"
                    } object-cover rounded-2xl`}
                />
              </CarouselItem>
            );
          })}
        </CarouselContent>
        {isHovered && (
          <>
            <div className="">
              <CarouselPrevious className='left-1' />
            </div>
            <div className="">
              <CarouselNext className='right-1' />
            </div>
            <CarouselIndicators
              currentIndex={currentIndex}
              total={count}
              onClick={(index) => api?.scrollTo(index)} // Allow clicking on indicators to change image
            />
          </>
        )}

      </Carousel>

      <div onClick={onClick} className="flex items-center cursor-pointer justify-start space-x-2">
        <img
          src={countryFlag}
          className="w-7 h-7 rounded-full object-cover"
          alt="Country Flag"
        />
        <span>{location}</span>
      </div>
    </div>
  );
}
