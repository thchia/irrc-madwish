import Vuex from "vuex";

const MUTATIONS = Object.freeze({
  SET_TEACHERS: "SET_TEACHERS",
  SET_UPDATE_TEACHER_SUCCESS: "SET_UPDATE_TEACHER_SUCCESS",
});
export const teacherState = { teachers: [], updateTeacherSuccess: undefined };
export const teacherActions = {
  async getAllTeachers({ commit }) {
    const response = await fetch("/api/teachers");
    const teacherData = await response.json();
    commit(MUTATIONS.SET_TEACHERS, teacherData);
  },
  async createTeacher({ dispatch }, teacherData) {
    const payload = {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },

      body: JSON.stringify(teacherData),
    };
    const response = await fetch("api/teachers", payload);
    dispatch("getAllTeachers");
    return response;
  },
  async patchTeacher({ dispatch, commit }, teacherData) {
    const payload = {
      method: "PATCH",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(teacherData),
    };
    const result = await fetch(
      `api/teachers/${teacherData.TeacherID}`,
      payload
    );
    if (result.status < 400) {
      commit(MUTATIONS.SET_UPDATE_TEACHER_SUCCESS, true);
      dispatch("getAllTeachers");
    } else {
      commit(MUTATIONS.SET_UPDATE_TEACHER_SUCCESS, false);
    }
  },
  resetTeacherUpdateSuccess({ commit }, value) {
    commit(MUTATIONS.SET_UPDATE_TEACHER_SUCCESS, value);
  },

  async updateTeacherStatus(
    { commit, dispatch },
    { teacherID, previousStatusString, nextStatusString, updatedBy, reason }
  ) {
    // PATCH student
    const teacherRequestOptions = {
      method: "PATCH",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        TeacherID: teacherID,
        PreviousStatusString: previousStatusString,
        NextStatusString: nextStatusString,
      }),
    };

    // POST statusUpdate
    const statusUpdateRequestOptions = {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        TeacherID: teacherID,
        PreviousStatusString: previousStatusString,
        NextStatusString: nextStatusString,
        UpdatedBy: updatedBy,
        ReasonString: reason,
      }),
    };

    fetch("/api/statusUpdates", statusUpdateRequestOptions)
      .then((response) => {
        if (response.status !== 200) {
          throw new Error(response);
        }
        dispatch("getAllTeachers");
        // Call deletion API
        fetch("/api/matches/unmatch-teacher", {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            TeacherID: teacherID,
            NextStatusString: nextStatusString,
          }),
        });
        // TODO: Call matches API after this to refresh
      })
      .catch((err) => {
        console.error(err);
      });
  },
};
export const teacherMutations = {
  [MUTATIONS.SET_TEACHERS](state, teachers) {
    state.teachers = teachers;
  },
  [MUTATIONS.SET_UPDATE_TEACHER_SUCCESS](state, value) {
    state.updateTeacherSuccess = value;
  },
};
export const teacherGetters = {
  teachers(state) {
    return state.teachers;
  },
  getTeacherByTeacherId: (state) => (id) => {
    return state.teachers.find((teacher) => teacher.TeacherID == id);
  },

  suggestedTeachers(state) {
    return (studentId) => {
      // 1. Find the student using the ID
      const student = state.students.find(
        (student) => student.StudentID === studentId
      );
      if (!student) {
        return [];
      }
      // 2. Find their native language
      const studentNativeLanguage = student.NativeLanguageID;

      // 3. Get unmatched teachers whose first or second language equals student's native language
      const relevantTeachers = state.teachers.filter((teacher) => {
        const doesNativeLanguageMatch =
          teacher.NativeLanguageID === studentNativeLanguage;
        const doesSecondLanguageMatch =
          teacher.SecondLanguageID === studentNativeLanguage;

        return doesNativeLanguageMatch || doesSecondLanguageMatch;
      });

      // 4. Sort teachers by date joined AND status
      relevantTeachers.sort((t1, t2) => {
        if (
          t1.status.Description === "UNMATCHED" &&
          t2.status.Description === "MATCHED"
        ) {
          return -1;
        }
        if (
          t2.status.Description === "UNMATCHED" &&
          t1.status.Description === "MATCHED"
        ) {
          return 1;
        }
        if (t2.status.Description === t1.status.Description) {
          if (t1.created_at === t2.created_at) {
            return 0;
          }
          if (t1.created_at > t2.created_at) {
            return 1;
          }
          if (t1.created_at < t2.created_at) {
            return -1;
          }
        }
      });

      // 5. Take the top 5
      return relevantTeachers.slice(0, 5);
    };
  },
};
