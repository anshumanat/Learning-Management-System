import React, { useEffect, useState } from 'react';
import { fetchCourseCategories } from 'path-to-your-api';

const CourseInformationForm = () => {
  const [courseCategories, setCourseCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const getCategories = async () => {
      setLoading(true);
      const categories = await fetchCourseCategories();
      if (categories && categories.length > 0) {
        setCourseCategories(categories);
      }
      setLoading(false);
    };

    getCategories();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>Course Information</h1>
      <form>
        {/* Your form fields here */}
      </form>
      <div>
        <h2>Course Categories</h2>
        <ul>
          {courseCategories.map((category) => (
            <li key={category.id}>{category.name}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default CourseInformationForm;