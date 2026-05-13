import { WebSocketGateway, SubscribeMessage, MessageBody } from '@nestjs/websockets';
import { LocationService } from './location.service';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';

@WebSocketGateway()
export class LocationGateway {
  constructor(private readonly locationService: LocationService) {}

  @SubscribeMessage('createLocation')
  create(@MessageBody() createLocationDto: CreateLocationDto) {
    return this.locationService.create(createLocationDto);
  }

  @SubscribeMessage('findAllLocation')
  findAll() {
    return this.locationService.findAll();
  }

  @SubscribeMessage('findOneLocation')
  findOne(@MessageBody() id: number) {
    return this.locationService.findOne(id);
  }

  @SubscribeMessage('updateLocation')
  update(@MessageBody() updateLocationDto: UpdateLocationDto) {
    return this.locationService.update(updateLocationDto.id, updateLocationDto);
  }

  @SubscribeMessage('removeLocation')
  remove(@MessageBody() id: number) {
    return this.locationService.remove(id);
  }
}
