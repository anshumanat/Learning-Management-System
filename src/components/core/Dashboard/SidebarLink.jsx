import * as Icons from "react-icons/vsc"
import { useDispatch } from "react-redux"
import { NavLink, matchPath, useLocation } from "react-router-dom"

import { resetCourseState } from "../../../slices/courseSlice"

export default function SidebarLink({ link, iconName }) {
  const Icon = Icons[iconName]
  const location = useLocation()
  const dispatch = useDispatch()

  const matchRoute = (route) => {
    return matchPath({ path: route }, location.pathname)
  }

  // Only reset course state if navigating away from Add Course or Edit Course
  const handleNavClick = (e) => {
    const isLeavingAddOrEditCourse =
      location.pathname.startsWith("/dashboard/add-course") ||
      location.pathname.startsWith("/dashboard/edit-course")
    const isGoingToAddOrEditCourse =
      link.path.startsWith("/dashboard/add-course") ||
      link.path.startsWith("/dashboard/edit-course")
    // Only reset if leaving Add/Edit Course and not going to another Add/Edit Course
    if (isLeavingAddOrEditCourse && !isGoingToAddOrEditCourse) {
      dispatch(resetCourseState())
    }
  }

  return (
    <NavLink
      to={link.path}
      onClick={handleNavClick}
      className={`relative px-8 py-2 text-sm font-medium ${
        matchRoute(link.path)
          ? "bg-yellow-800 text-yellow-50"
          : "bg-opacity-0 text-richblack-300"
      } transition-all duration-200`}
    >
      <span
        className={`absolute left-0 top-0 h-full w-[0.15rem] bg-yellow-50 ${
          matchRoute(link.path) ? "opacity-100" : "opacity-0"
        }`}
      ></span>
      <div className="flex items-center gap-x-2">
        {/* Icon Goes Here */}
        <Icon className="text-lg" />
        <span>{link.name}</span>
      </div>
    </NavLink>
  )
}