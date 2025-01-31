import React from "react";
import CategoryCard from "./CategoryCard";

const CategoryList = ({ data }) => {
    console.log(data);
    return (
        <>
            {
                data?.map((category, index) => (
                    <CategoryCard category={category} key={index} />
                ))
            }
        </>
    );
};

export default CategoryList;
