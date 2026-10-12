const getText = (...values) =>
  values.find((value) => typeof value === "string" && value.trim())?.trim() || "";

const getPersonName = (person) => {
  if (!person || typeof person !== "object") return "";

  return getText(
    person.name,
    person.full_name,
    person.employee_name,
    [person.first_name, person.last_name].filter(Boolean).join(" "),
    person.username,
    person.user_name,
  );
};

export const getEmployeeName = (employee) =>
  getText(
    typeof employee === "object" ? "" : employee,
    getPersonName(employee),
    getPersonName(employee?.user),
  );

export const getEmployeeUsername = (employee) =>
  getText(
    employee?.username,
    employee?.user_name,
    employee?.user?.username,
    employee?.user?.user_name,
  );

export const getEvaluationEmployeeName = (evaluation) =>
  getText(
    evaluation?.employee_name,
    getPersonName(evaluation?.employee),
    getPersonName(evaluation?.user),
    evaluation?.name,
    evaluation?.username,
    evaluation?.user_name,
  );

export const getEvaluationEmployeeUsername = (evaluation) =>
  getText(
    evaluation?.employee_username,
    evaluation?.username,
    evaluation?.user_name,
    evaluation?.employee?.username,
    evaluation?.employee?.user_name,
    evaluation?.employee?.user?.username,
    evaluation?.user?.username,
    evaluation?.user?.user_name,
  );

export const getEvaluationEvaluatorName = (evaluation) =>
  getText(
    evaluation?.evaluator_name,
    getPersonName(evaluation?.evaluator),
    evaluation?.evaluator_username,
    evaluation?.evaluator?.username,
    evaluation?.evaluator?.user_name,
  );

export const getEvaluationEvaluatorUsername = (evaluation) =>
  getText(
    evaluation?.evaluator_username,
    evaluation?.evaluator?.username,
    evaluation?.evaluator?.user_name,
  );
