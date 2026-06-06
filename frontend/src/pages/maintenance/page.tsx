"use client"; 

export default function Maintenance() {
  const handleBackClick = () => {
    window.location.href = "/";
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">Maintenance</h1>
        <p className="text-lg text-gray-600 mb-6">
          Halaman masih dalam pengembangan dan sedang dalam tahap perbaikan, Terimakasih sudah mampir.
        </p>
        <button
          onClick={handleBackClick}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition duration-300"
        >
          Kembali
        </button>
      </div>
    </div>
  );
}
