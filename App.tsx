import React, {useCallback, useRef, useEffect, useState} from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  Image,
  ActivityIndicator,
  View,
  Alert,
  Linking,
  StatusBar,
  Pressable,
} from 'react-native';
import ImagePicker, {ImageOrVideo} from 'react-native-image-crop-picker';
import {Camera, useCameraDevices} from 'react-native-vision-camera';
import {CameraPermissionRequestResult} from 'react-native-vision-camera';
import TextRecognition from 'react-native-text-recognition';

const App: React.FC = () => {
  const camera = useRef<Camera>(null);
  const devices = useCameraDevices();
  let device: any = devices.back;
  const [hasPermissions, setHasPermissions] = useState<boolean>(false);

  const [processedText, setProcessedText] = React.useState<string>(
    'Scan a Card to see\nCard Number here',
  );
  const [isProcessingText, setIsProcessingText] = useState<boolean>(false);
  const [cardIsFound, setCardIsFound] = useState<boolean>(false);

  useEffect(() => {
    (async () => {
      const cameraPermission: CameraPermissionRequestResult =
        await Camera.requestCameraPermission();
      const microPhonePermission: CameraPermissionRequestResult =
        await Camera.requestMicrophonePermission();
      if (cameraPermission === 'denied' || microPhonePermission === 'denied') {
        Alert.alert(
          'Allow Permissions',
          'Please allow camera and microphone permission to access camera features',
          [
            {
              text: 'Go to Settings',
              onPress: () => Linking.openSettings(),
            },
            {
              text: 'Cancel',
            },
          ],
        );
        setHasPermissions(false);
      } else {
        setHasPermissions(true);
      }
    })();
  }, []);

  const captureAndRecognize = useCallback(async () => {
    setIsProcessingText(true);
    try {
      const image = await camera.current?.takePhoto({
        qualityPrioritization: 'quality',
        enableAutoStabilization: true,
        flash: 'off',
        skipMetadata: true,
      });
      const result: string[] = await TextRecognition.recognize(
        image?.path as string,
        ); 
        console.log('result: ', result);
        validateCard(result);
      setIsProcessingText(false);
    } catch (err) {
      console.log('err:', err);
      setIsProcessingText(false);
    }
  }, []);

  const pickAndRecognize: () => void = useCallback(async () => {
    setIsProcessingText(true);
    ImagePicker.openPicker({
      cropping: false,
    })
      .then(async (res: ImageOrVideo) => { 
        const result: string[] = await TextRecognition.recognize(res?.path);  
        setIsProcessingText(false);
        validateCard(result);
      })
      .catch(err => {
        console.log('err:', err);
        setIsProcessingText(false);
      });
  }, []);

  // Validation valid credit card

  const findCardNumberInArray: (arr: string[]) => string = arr => {
    let creditCardNumber = '';
    arr.forEach(e => {
      let numericValues = e.replace(/\D/g, '');
      let creditCardRegex =
        /^(?:4\[0-9]{12}(?:[0-9]{3})?|[25\][1-7]\[0-9]{14}|6(?:011|5[0-9\][0-9])\[0-9]{12}|3[47\][0-9]{13}|3(?:0\[0-5]|[68\][0-9])[0-9]{11}|(?:2131|1800|35\d{3})\d{11})$/;
      creditCardRegex = /^(?:4[0-9]{12}(?:[0-9]{3})?)$/;

      if (creditCardRegex.test(numericValues)) {
        creditCardNumber = numericValues;
        return;
      }
    });
    return creditCardNumber;
  };

  const validateCard: (result: string[]) => void = result => {
    const cardNumber = findCardNumberInArray(result); 
    if (cardNumber?.length) {
      setProcessedText(cardNumber);
      setCardIsFound(true);
    } else {
      setProcessedText('No valid Credit Card found, please try again!!');
      setCardIsFound(false);
    }
  };

  const getFormattedCreditCardNumber: (cardNo: string) => string = cardNo => {
    let formattedCardNo = '';
    for (let i = 0; i < cardNo?.length; i++) {
      if (i % 4 === 0 && i !== 0) {
        formattedCardNo += ` • ${cardNo?.[i]}`;
        continue;
      }
      formattedCardNo += cardNo?.[i];
    }
    return formattedCardNo;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={'dark-content'} />
      <Pressable style={styles.galleryBtn} onPress={pickAndRecognize}>
        <Text style={styles.btnText}>Pick from Gallery</Text>
      </Pressable>
      <View
        style={{
          justifyContent: 'center',
          alignItems: 'center',
        }}>
        {isProcessingText ? (
          <ActivityIndicator
            size={'large'}
            style={styles.activityIndicator}
            color={'blue'}
          />
        ) : cardIsFound ? (
          <Text style={styles.creditCardNo}>
            {getFormattedCreditCardNumber(processedText)}
          </Text>
        ) : (
          <Text style={styles.errorText}>{processedText}</Text>
        )}
      </View>
      {device && hasPermissions ? (
        <View>
          <Camera
            photo
            enableHighQualityPhotos
            ref={camera}
            style={styles.camera}
            isActive={true}
            device={device}
          />
          <Pressable
            style={styles.captureBtnContainer}
            // We will define this method later
            onPress={captureAndRecognize}>
            <Image
              source={require('./assets/camera.png')}
              style={{height: 40, width: 40}}
              tintColor={'#000'}
            />
          </Pressable>
        </View>
      ) : (
        <Text>No Camera Found</Text>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111',
    letterSpacing: 0.6,
    marginTop: 18,
  },
  galleryBtn: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    backgroundColor: '#000',
    borderRadius: 40,
    marginTop: 18,
  },
  btnText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '400',
    letterSpacing: 0.4,
  },
  camera: {
    marginVertical: 24,
    height: 240,
    width: 360,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#000',
  },
  captureBtnContainer: {
    position: 'absolute',
    bottom: 28,
    right: 10,
    padding: 10,
    borderRadius: 40,
    backgroundColor: '#fff',
    width: 60,
    height: 60,
  },
  activityIndicator: {
    borderRadius: 40,
    backgroundColor: '#fff',
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  creditCardNo: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    letterSpacing: 0.6,
    marginTop: 18,
  },
  errorText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    letterSpacing: 0.6,
    marginTop: 18,
    textAlign: 'center',
  },
});

export default App;
