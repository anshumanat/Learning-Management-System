const Section = require("../models/Section");
const Course  = require("../models/Course");

exports.createSection = async (req,res)=>{
    try{
        //data fetch
        const {sectionName,courseId} = req.body;
        //data validation
        if(!sectionName || !courseId){
            return res.status(400).json({
                success:false,
                message:"Missing Properties",
            });
        }
        //create section
        const newSection = await Section.create({sectionName});
        //update course with section ObjectId
        const updateCourseDetails = await Course.findByIdAndUpdate(
                                                   courseId,
                                                   {
                                                    $push:{
                                                        courseContent:newSection._id,
                                                    }
                                                   },
                                                   {new:true},
                                                )
                                                //use populate to replace section/sub-section both in the updatecontectDetails
                                                .populate({
                                                   path: "courseContent",
                                                   populate: {
                                                     path: "subSection",
                                                   }
                                                   })
                                                .exec(); 
        //return response
        return res.status(200).json({
            success:true,
            message:"Section created successfully",
            updateCourseDetails,
        })

    }
    catch(error){
        return res.status(500).json({
            success:false,
            message:"Unable to create section ,please try again later",
            error:error.message,
        });
    }
}

//update section
exports.updateSection = async (req,res)=>{
    try{
        //data input
        const {sectionName,sectionId} = req.body;
        //data validation
        if(!sectionName || !sectionId){
            return res.status(400).json({
                success:false,
                message:"Missing Properties",
            });
        }
        //update data
        const section = await Section.findByIdAndUpdate(sectionId,{sectionName},{new:true});
        // Find the parent course and populate all sections and subsections
        const parentCourse = await Course.findOne({ courseContent: sectionId })
          .populate({
            path: "courseContent",
            populate: {
              path: "subSection",
            },
          })
          .exec();
        //return response
        return res.status(200).json({
          success:true,
          message:'Section Updated Successfully',
          updateCourseDetails: parentCourse,
        });
    }
    catch(error){
        return res.status(500).json({
            success:false,
            message:"Unable to create section ,please try again later",
            error:error.message,
        });
    }
};

//delete section
exports.deleteSection = async (req,res)=>{
    try{
        //get ID - assuming that we are sending ID in param
        const {sectionId, courseId} = req.body.sectionId ? req.body : req.params;
        // Remove section from courseContent array in Course
        const course = await Course.findOneAndUpdate(
            { courseContent: sectionId },
            { $pull: { courseContent: sectionId } },
            { new: true }
        ).populate({
            path: "courseContent",
            populate: { path: "subSection" }
        });
        // Delete the section
        await Section.findByIdAndDelete(sectionId);
        // Return updated course details
        return res.status(200).json({
            success:true,
            message:"Section Deleted Successfully",
            updateCourseDetails: course,
        })
    }
    catch(error){
        return res.status(500).json({
            success:false,
            message:"Unable to delete section ,please try again later",
            error:error.message,
        });
    }
};

