const NavigationButton = ({
  currentStep,
  prevStep,
  nextStep,
  getTotalSteps,
}) => {
  return (
    <div className="flex justify-between mt-8">
      <button
        type="button"
        onClick={prevStep}
        disabled={currentStep === 1}
        className={`px-6 py-3 rounded-lg font-medium ${
          currentStep === 1
            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
        }`}
      >
        Previous
      </button>

      {currentStep < getTotalSteps() ? (
        <button
          type="button"
          onClick={nextStep}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Next
        </button>
      ) : (
        <button
          type="submit"
          className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
        >
          Submit
        </button>
      )}
    </div>
  );
};

export default NavigationButton;
