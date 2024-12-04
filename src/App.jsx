import React, { useState, useRef, useEffect } from "react";
import Tesseract from "tesseract.js";
import Confetti from "react-confetti";
import tebrikSesi2 from "./assets/tebrik2.mp3";
import { Card, CardBody, CardSubtitle, CardTitle, Button, Input } from "reactstrap";

// Türkçe alfabesi
const turkceAlfabe = [
  "A", "B", "C", "Ç", "D", "E", "F", "G", "Ğ", "H", "I", "İ", "J", "K", "L",
  "M", "N", "O", "Ö", "P", "R", "S", "Ş", "T", "U", "Ü", "V", "Y", "Z"
];

// Sezar şifreleme fonksiyonu
const sezarSifresiOlustur = (metin, kaydirma = 3) => {
  return metin
    .toUpperCase()
    .split("")
    .map((char) => {
      const index = turkceAlfabe.indexOf(char);
      if (index !== -1) {
        let yeniIndex = (index - kaydirma + turkceAlfabe.length) % turkceAlfabe.length;
        return turkceAlfabe[yeniIndex];
      }
      return char;
    })
    .join("");
};

console.log(sezarSifresiOlustur("ALİ"))

const App = () => {
  const [ogrenciAdi, setOgrenciAdi] = useState("");
  const [ogrenciListesi, setOgrenciListesi] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrText, setOcrText] = useState("");
  const [showMessage, setShowMessage] = useState(false);
  const [tebrikMesaji, setTebrikMesaji] = useState("");
  const videoRef = useRef(null);
  const audioRef = useRef(null);

  // Kamera başlatma
  const startCamera = () => {
    if (navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then((stream) => {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        })
        .catch((err) => {
          console.log("Kamera başlatılamadı: " + err);
        });
    } else {
      console.log("getUserMedia API desteklenmiyor.");
    }
  };

  // OCR işlemi
  const ogrenciListesiRef = useRef(ogrenciListesi);

  useEffect(() => {
    ogrenciListesiRef.current = ogrenciListesi;
  }, [ogrenciListesi]);

  const handleOCROnFrame = () => {
    if (isProcessing || showMessage) return;

    setIsProcessing(true);

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

    Tesseract.recognize(canvas.toDataURL("image/png"), "tur", {
      logger: (m) => console.log(m),
    })
      .then(({ data: { text } }) => {
        const cleanedText = text.toUpperCase().trim();
        setOcrText(cleanedText);

        const ogrenci = ogrenciListesiRef.current.find(
          (ogr) => ogr.SezarSifresi === cleanedText
        );

        if (ogrenci) {
          setTebrikMesaji(`🎉 Tebrikler ${ogrenci.ogrenciAdi}! 🎉`);
          setShowMessage(true);
          audioRef.current.play();

          setTimeout(() => setShowMessage(false), 5000);
        }

        setIsProcessing(false);
      })
      .catch((err) => {
        console.log("OCR Hatası: ", err);
        setIsProcessing(false);
      });
  };


  // İlk yükleme ve temizleme
  useEffect(() => {
    startCamera();
    const interval = setInterval(() => {
      handleOCROnFrame();
    }, 1000);

    return () => {
      clearInterval(interval);
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject;
        const tracks = stream.getTracks();
        tracks.forEach((track) => track.stop());
      }
    };
  }, []);

  // Öğrenci ekleme
  const addStudent = () => {
    if (ogrenciAdi) {
      const yeniSifre = sezarSifresiOlustur(ogrenciAdi.toUpperCase());
      const yeniOgrenci = { ogrenciAdi: ogrenciAdi.toUpperCase(), SezarSifresi: yeniSifre };
      setOgrenciListesi([...ogrenciListesi, yeniOgrenci]);
      setOgrenciAdi("");
    }
  };

  return (
    <div>

      <div className="d-flex justify-content-center">
        <h1
          className="text-center my-4 p-3 fw-normal bg-light text-dark rounded-4"
          style={{
            display: 'inline-block'
          }}
        >
          Sezar Şifreni Okut!
        </h1>

      </div>

      <div className="d-flex justify-content-center rounded-5">
        <Card className="p-5 rounded-5" style={{ maxWidth: "735px" }}>
          <video
            ref={videoRef}
            width="640"
            height="480"
            className="shadow-lg"
            style={{ borderRadius: "50px" }}
          ></video>
          <CardBody>
            <CardTitle className="text-center" tag="h3">
              Algılanan Metin
            </CardTitle>
            <CardSubtitle className="mt-4 text-muted">
              {ocrText && <p>{ocrText}</p>}
            </CardSubtitle>
          </CardBody>
        </Card>
      </div>

      {/* Öğrenci Ekleme */}
      <div className="d-flex justify-content-center my-4">
        <Input
          type="text"
          value={ogrenciAdi}
          onChange={(e) => setOgrenciAdi(e.target.value)}
          placeholder="Öğrenci Adı"
          className="w-50"
        />
        <Button onClick={addStudent} color="dark" className="ms-2">
          Öğrenci Ekle
        </Button>
      </div>

      {/* Alkış sesi */}
      <audio ref={audioRef} src={tebrikSesi2} />

      {
        showMessage && (
          <div>
            <Confetti width={window.innerWidth} height={window.innerHeight} />
            <h1 style={tebrikStili}>{tebrikMesaji}</h1>
          </div>
        )
      }
    </div >
  );
};

// Tebrik mesajı stili
const tebrikStili = {
  position: "fixed",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  backgroundColor: "white",
  padding: "20px",
  borderRadius: "10px",
  textAlign: "center",
  boxShadow: "0 0 100px rgba(0,0,0,0.5)",
};

export default App;
