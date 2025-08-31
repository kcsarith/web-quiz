const AudioPlayer: React.FC<{ audioData: string }> = ({ audioData }) => {
  return (
    <div className="mt-4">
      <h4 className="text-sm font-medium text-gray-700 mb-2">Audio Playback</h4>
      <audio controls className="w-full">
        <source src={audioData} type="audio/mpeg" />
        Your browser does not support the audio element.
      </audio>
    </div>
  );
};


export default AudioPlayer;
